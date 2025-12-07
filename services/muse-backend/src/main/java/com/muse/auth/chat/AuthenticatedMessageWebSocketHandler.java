package com.muse.auth.chat;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Component
public class AuthenticatedMessageWebSocketHandler extends TextWebSocketHandler {

    private final JwtDecoder jwtDecoder;
    private final Map<Long, ConcurrentHashMap.KeySetView<WebSocketSession, Boolean>> userSessions = new ConcurrentHashMap<>();

    public AuthenticatedMessageWebSocketHandler(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = extractToken(session.getUri());
        if (token == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("token missing"));
            return;
        }
        try {
            Jwt jwt = jwtDecoder.decode(token);
            Long userId = jwt.getClaim("userId");
            if (userId == null) {
                session.close(CloseStatus.POLICY_VIOLATION.withReason("invalid token claims"));
                return;
            }
            session.getAttributes().put("userId", userId);
            userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
        } catch (JwtException e) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("invalid token"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Object uid = session.getAttributes().get("userId");
        if (uid instanceof Long) {
            Long userId = (Long) uid;
            var set = userSessions.get(userId);
            if (set != null) set.remove(session);
        }
    }

    private String extractToken(URI uri) {
        if (uri == null) return null;
        String q = uri.getQuery();
        if (q == null) return null;
        for (var part : q.split("&")) {
            var kv = part.split("=", 2);
            if (kv.length == 2 && kv[0].equals("token")) return kv[1];
        }
        return null;
    }

    public void sendToUser(Long userId, String payload) {
        var set = userSessions.get(userId);
        if (set == null) return;
        for (var s : set) {
            try {
                if (s.isOpen()) s.sendMessage(new TextMessage(payload));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
