package com.muse.auth.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/**
 * KeyRegistryService (updated)
 * - saveDeviceKeys
 * - getPublicKeys
 * - claimPreKey (atomically remove a one-time prekey from devices and insert into claimed_prekeys with audit)
 * - consumePreKey (mark claimed_prekeys consumed)
 * - reclaimStaleClaims (move unconsumed claimed prekeys back into devices.prekeys after TTL)
 */
@Service
public class KeyRegistryService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper = new ObjectMapper();

    public KeyRegistryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void saveDeviceKeys(Long userId, Map<String, Object> body) {
        String deviceId = (String) body.get("deviceId");
        String deviceName = (String) body.getOrDefault("deviceName", "web");
        String identityKey = (String) body.get("identityKey"); // base64
        String signedPrekey = (String) body.get("signedPrekey"); // base64
        String signedPrekeySig = (String) body.get("signedPrekeySignature"); // base64
        Object prekeys = body.get("prekeys"); // array of { keyId, publicKey }

        String prekeysJson;
        try {
            prekeysJson = mapper.writeValueAsString(prekeys == null ? new ArrayList<>() : prekeys);
        } catch (JsonProcessingException e) {
            prekeysJson = "[]";
        }

        Integer count = jdbc.queryForObject(
                "select count(1) from devices where user_id = ? and device_id = ?",
                Integer.class, userId, deviceId);

        if (count != null && count > 0) {
            jdbc.update(
                    "update devices set device_name=?, identity_key=?, signed_prekey=?, signed_prekey_signature=?, prekeys=?, last_seen=now() where user_id=? and device_id=?",
                    deviceName, identityKey, signedPrekey, signedPrekeySig, prekeysJson, userId, deviceId
            );
        } else {
            jdbc.update(
                    "insert into devices (user_id, device_id, device_name, identity_key, signed_prekey, signed_prekey_signature, prekeys, created_at) values (?,?,?,?,?,?,?, now())",
                    userId, deviceId, deviceName, identityKey, signedPrekey, signedPrekeySig, prekeysJson
            );
        }
    }

    public Map<String,Object> getPublicKeys(Long userId) {
        var rows = jdbc.queryForList(
                "select device_id, device_name, identity_key, signed_prekey, signed_prekey_signature, prekeys, created_at from devices where user_id = ?",
                userId);
        return Map.of("devices", rows);
    }

    /**
     * Atomically claim a one-time prekey for targetUserId/targetDeviceId.
     * Removes the prekey from devices.prekeys and inserts into claimed_prekeys with claimed_by.
     * Returns the chosen prekey map { keyId, publicKey } or null if none available.
     */
    @Transactional
    public Map<String,Object> claimPreKey(Long targetUserId, String targetDeviceId, Long claimedByUserId) {
        // Lock the row for update
        String sql = "select prekeys from devices where user_id = ? and device_id = ? for update";
        List<Map<String, Object>> rows = jdbc.queryForList(sql, targetUserId, targetDeviceId);
        if (rows.isEmpty()) return null;

        Object prekeysObj = rows.get(0).get("prekeys");
        if (prekeysObj == null) return null;

        String prekeysJson = prekeysObj.toString();
        try {
            CollectionType listType = mapper.getTypeFactory().constructCollectionType(List.class, Map.class);
            List<Map<String,Object>> list = mapper.readValue(prekeysJson, listType);

            if (list.isEmpty()) return null;

            // pick the first element
            Map<String,Object> chosen = list.remove(0);

            // write back updated list
            String newJson = mapper.writeValueAsString(list);
            jdbc.update("update devices set prekeys = ? where user_id = ? and device_id = ?", newJson, targetUserId, targetDeviceId);

            // insert into claimed_prekeys
            long keyId = Long.parseLong(String.valueOf(chosen.get("keyId")));
            String publicKey = String.valueOf(chosen.get("publicKey"));
            jdbc.update("insert into claimed_prekeys (target_user_id, target_device_id, key_id, public_key, claimed_by_user_id, claimed_at, consumed, reclaimed) values (?,?,?,?,?, now(), false, false)",
                    targetUserId, targetDeviceId, keyId, publicKey, claimedByUserId);

            // get last inserted id (Postgres specific)
            Long claimedId = jdbc.queryForObject("select currval(pg_get_serial_sequence('claimed_prekeys','id'))", Long.class);

            // audit entry
            insertAudit(claimedId, "CLAIM", claimedByUserId, Map.of("targetUserId", targetUserId, "targetDeviceId", targetDeviceId, "keyId", keyId));

            return chosen;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Mark a claimed prekey consumed. Called when we observe the message that used it (sender includes preKeyId in metadata).
     * Returns true if consumed flag updated, false if not found.
     */
    @Transactional
    public boolean consumeClaimedPreKey(Long targetUserId, String targetDeviceId, long keyId, Long actorUserId) {
        // find the claimed_prekeys row where consumed=false
        List<Map<String,Object>> rows = jdbc.queryForList("select id from claimed_prekeys where target_user_id = ? and target_device_id = ? and key_id = ? and consumed = false order by claimed_at limit 1",
                targetUserId, targetDeviceId, keyId);
        if (rows.isEmpty()) return false;
        Long cid = ((Number) rows.get(0).get("id")).longValue();

        jdbc.update("update claimed_prekeys set consumed = true, consumed_at = now() where id = ?", cid);
        insertAudit(cid, "CONSUME", actorUserId, Map.of("keyId", keyId));
        return true;
    }

    /**
     * Reclaim stale claimed prekeys older than ttlSeconds and not consumed.
     * It will append the prekey back to the device's prekeys JSON and mark reclaimed = true.
     */
    @Transactional
    public int reclaimStaleClaims(long ttlSeconds) {
        Instant cutoff = Instant.now().minusSeconds(ttlSeconds);
        List<Map<String,Object>> rows = jdbc.queryForList("select id, target_user_id, target_device_id, key_id, public_key from claimed_prekeys where consumed = false and reclaimed = false and claimed_at < ?",
                Timestamp.from(cutoff));
        int reclaimedCount = 0;
        for (var r : rows) {
            Long id = ((Number) r.get("id")).longValue();
            Long targetUserId = ((Number) r.get("target_user_id")).longValue();
            String targetDeviceId = (String) r.get("target_device_id");
            long keyId = ((Number) r.get("key_id")).longValue();
            String publicKey = (String) r.get("public_key");

            // append back to devices.prekeys array
            // fetch existing prekeys
            List<Map<String,Object>> cur = new ArrayList<>();
            List<Map<String,Object>> devRows = jdbc.queryForList("select prekeys from devices where user_id = ? and device_id = ? for update", targetUserId, targetDeviceId);
            if (!devRows.isEmpty() && devRows.get(0).get("prekeys") != null) {
                try {
                    String json = devRows.get(0).get("prekeys").toString();
                    CollectionType listType = mapper.getTypeFactory().constructCollectionType(List.class, Map.class);
                    cur = mapper.readValue(json, listType);
                } catch (Exception ex) {
                    cur = new ArrayList<>();
                }
            }
            // add back claimed prekey object
            Map<String,Object> pk = Map.of("keyId", keyId, "publicKey", publicKey);
            cur.add(pk);
            try {
                String newJson = mapper.writeValueAsString(cur);
                jdbc.update("update devices set prekeys = ? where user_id = ? and device_id = ?", newJson, targetUserId, targetDeviceId);
                // mark reclaimed
                jdbc.update("update claimed_prekeys set reclaimed = true, reclaimed_at = now() where id = ?", id);
                insertAudit(id, "RECLAIM", null, Map.of("keyId", keyId));
                reclaimedCount++;
            } catch (JsonProcessingException ex) {
                ex.printStackTrace();
            }
        }
        return reclaimedCount;
    }

    private void insertAudit(Long claimedPrekeyId, String action, Long actorUserId, Map<String, Object> details) {
        try {
            String d = mapper.writeValueAsString(details == null ? Map.of() : details);
            jdbc.update("insert into prekey_claim_audit (claimed_prekey_id, action, actor_user_id, created_at, details) values (?,?,?, now(), ?::jsonb)",
                    claimedPrekeyId, action, actorUserId, d);
        } catch (Exception e) {
            // don't fail main flow on audit failure
            e.printStackTrace();
        }
    }
}