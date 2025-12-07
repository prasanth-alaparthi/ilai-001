package com.muse.auth.chat;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

/**
 * MessageService: saves ciphertext into DB and dispatches to recipients.
 * If message metadata includes a 'preKeyId' and 'toUser' + 'toDevice', mark that prekey as consumed.
 */
@Service
public class MessageService {

    private final JdbcTemplate jdbc;
    private final MessageWebSocketHandler wsHandler;
    private final KeyRegistryService keyRegistryService;
    private final ObjectMapper mapper = new ObjectMapper();

    public MessageService(JdbcTemplate jdbc, MessageWebSocketHandler wsHandler, KeyRegistryService keyRegistryService) {
        this.jdbc = jdbc;
        this.wsHandler = wsHandler;
        this.keyRegistryService = keyRegistryService;
    }

    @Transactional
    public void saveAndDispatch(Long senderUserId, Map<String, Object> body) {
        // body: conversationId, senderDeviceId, ciphertext (base64), ciphertextVersion, metadata
        Long conversationId = body.get("conversationId") == null ? null : (body.get("conversationId") instanceof Number ? ((Number) body.get("conversationId")).longValue() : Long.valueOf(body.get("conversationId").toString()));
        String senderDeviceId = (String) body.get("senderDeviceId");
        String ciphertextB64 = (String) body.get("ciphertext");
        String ciphertextVersion = (String) body.getOrDefault("ciphertextVersion", "signal-lite-v1");
        Object metadata = body.get("metadata");

        byte[] cipherBytes = java.util.Base64.getDecoder().decode(ciphertextB64);

        // Save message row (metadata as JSON)
        String metadataJson;
        try {
            metadataJson = metadata == null ? "{}" : mapper.writeValueAsString(metadata);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        jdbc.update("insert into messages (conversation_id, sender_user_id, sender_device_id, ciphertext, ciphertext_version, metadata, created_at) values (?,?,?,?,?,?::jsonb, now())",
                conversationId, senderUserId, senderDeviceId, cipherBytes, ciphertextVersion, metadataJson);

        // If metadata includes a one-time prekey id used for a prekey message, consume it.
        // Expected metadata keys (client must send them when performing X3DH handshake):
        // metadata.preKeyId   -> numeric id of the one-time prekey used on recipient device
        // metadata.toUser     -> recipient user id
        // metadata.toDevice   -> recipient device id
        try {
            if (metadata instanceof Map) {
                Map<?,?> metaMap = (Map<?,?>) metadata;
                Object preKeyIdObj = metaMap.get("preKeyId");
                Object toUserObj = metaMap.get("toUser");
                Object toDeviceObj = metaMap.get("toDevice");
                if (preKeyIdObj != null && toUserObj != null && toDeviceObj != null) {
                    long preKeyId = Long.parseLong(String.valueOf(preKeyIdObj));
                    long toUser = Long.parseLong(String.valueOf(toUserObj));
                    String toDevice = String.valueOf(toDeviceObj);

                    boolean consumed = keyRegistryService.consumeClaimedPreKey(toUser, toDevice, preKeyId, senderUserId);
                    if (!consumed) {
                        System.out.printf("Claimed preKey %d for user %d device %s could not be consumed (maybe not claimed or already consumed)%n", preKeyId, toUser, toDevice);
                    } else {
                        System.out.printf("Claimed preKey %d consumed for user %d device %s%n", preKeyId, toUser, toDevice);
                    }
                }
            }
        } catch (Exception e) {
            // don't fail message save due to prekey consumption error; just log
            e.printStackTrace();
        }

        // dispatch to conversation members if conversationId provided, otherwise
        // dispatch to single recipient if metadata.toUser present (1:1).
        try {
            String payload = mapper.writeValueAsString(Map.of(
                    "type", "message",
                    "conversationId", conversationId,
                    "ciphertext", ciphertextB64,
                    "ciphertextVersion", ciphertextVersion,
                    "metadata", metadata
            ));

            if (conversationId != null) {
                // find members of conversation and dispatch
                List<Map<String,Object>> members = jdbc.queryForList("select user_id from conversation_members where conversation_id = ?", conversationId);
                for (var m : members) {
                    String uid = String.valueOf(m.get("user_id"));
                    wsHandler.sendToUser(uid, payload);
                }
            } else {
                // fallback: if metadata contains toUser send to that user
                if (metadata instanceof Map && ((Map<?,?>) metadata).get("toUser") != null) {
                    long toUser = Long.parseLong(String.valueOf(((Map<?,?>) metadata).get("toUser")));
                    wsHandler.sendToUser(String.valueOf(toUser), payload);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}