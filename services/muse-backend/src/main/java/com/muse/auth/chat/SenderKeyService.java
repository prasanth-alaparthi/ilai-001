package com.muse.auth.chat;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class SenderKeyService {

    private final JdbcTemplate jdbc;
    private final AuthenticatedMessageWebSocketHandler wsHandler;

    public SenderKeyService(JdbcTemplate jdbc, AuthenticatedMessageWebSocketHandler wsHandler) {
        this.jdbc = jdbc;
        this.wsHandler = wsHandler;
    }

    @Transactional
    public void storeEnvelopes(Long groupId, Long senderUserId, java.util.List<Map<String,Object>> envelopes) {
        // envelopes: [{ targetUserId, targetDeviceId, envelopeBase64 }]
        for (Map<String,Object> e : envelopes) {
            Long targetUserId = Long.valueOf(String.valueOf(e.get("targetUserId")));
            String targetDeviceId = (String) e.get("targetDeviceId");
            String envelopeB64 = (String) e.get("envelope");
            byte[] envelopeBytes = java.util.Base64.getDecoder().decode(envelopeB64);
            jdbc.update("insert into group_sender_envelopes (group_id, sender_user_id, target_user_id, target_device_id, envelope, created_at) values (?,?,?,?,?, now())",
                    groupId, senderUserId, targetUserId, targetDeviceId, envelopeBytes);
            // push a notification to that user (so device will fetch envelopes)
            try {
                wsHandler.sendToUser(targetUserId, String.format("{\"type\":\"senderkey_envelope\",\"groupId\":%d}", groupId));
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    // Client device calls to fetch its pending envelopes
    public java.util.List<Map<String,Object>> fetchPendingEnvelopes(Long userId, String deviceId) {
        return jdbc.queryForList("select id, group_id, sender_user_id, envelope from group_sender_envelopes where target_user_id = ? and target_device_id = ? and consumed = false",
                userId, deviceId);
    }

    public void markConsumed(Long envelopeId) {
        jdbc.update("update group_sender_envelopes set consumed = true where id = ?", envelopeId);
    }
}