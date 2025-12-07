package com.muse.auth.chat;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Very small WebSocket handler: maps userId -> WebSocketSession(s)
 * In production, authenticate connections (JWT) and map to user account.
 */
@Component
public class MessageWebSocketHandler extends TextWebSocketHandler {

    // map userId -> list of sessions (support multi-device)
    private final Map<String, ConcurrentHashMap.KeySetView<WebSocketSession, Boolean>> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Expect ?userId=123 on connection. In prod use JWT and parse Principal.
        String userId = getUserIdFromSession(session);
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("missing userId"));
            return;
        }
        sessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            var set = sessions.get(userId);
            if (set != null) set.remove(session);
        }
    }

    private String getUserIdFromSession(WebSocketSession session) {
        var uri = session.getUri();
        if (uri == null) return null;
        var query = uri.getQuery();
        if (query == null) return null;
        for (var part : query.split("&")) {
            var kv = part.split("=", 2);
            if (kv.length == 2 && kv[0].equals("userId")) return kv[1];
        }
        return null;
    }

    public void sendToUser(String userId, String payload) {
        var set = sessions.get(userId);
        if (set == null) return;
        for (var s : set) {
            try {
                if (s.isOpen()) s.sendMessage(new TextMessage(payload));
            } catch (Exception e) {
                // log and ignore
                e.printStackTrace();
            }
        }
    }
}