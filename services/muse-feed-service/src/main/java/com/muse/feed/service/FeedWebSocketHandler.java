package com.muse.feed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class FeedWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(FeedWebSocketHandler.class);
    private final Map<Long, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>(); // Map userId to sessions
    private final Map<String, Long> sessionToUserId = new ConcurrentHashMap<>(); // Map sessionId to userId
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Principal principal = (Principal) session.getAttributes().get("user");
        if (principal == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("User not authenticated."));
            return;
        }

        Long userId = Long.valueOf(principal.getName()); // Assuming principal.getName() returns userId
        logger.info("User '{}' connected to feed. Session ID: {}", userId, session.getId());

        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(session);
        sessionToUserId.put(session.getId(), userId);

        // Optionally, send a welcome message or initial feed data
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("type", "welcome", "message", "Connected to feed"))));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // For now, we don't expect clients to send messages to the feed WebSocket.
        // This handler is primarily for broadcasting from the server.
        logger.warn("Received unexpected message from session {}: {}", session.getId(), message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = sessionToUserId.remove(session.getId());
        if (userId != null) {
            List<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId); // Remove user entry if no active sessions
                }
                logger.info("User '{}' disconnected from feed. Session ID: {}", userId, session.getId());
            }
        }
    }

    public void broadcastToUser(Long userId, String message) throws IOException {
        List<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            }
        }
    }

    public void broadcastToAll(String message) throws IOException {
        for (List<WebSocketSession> sessions : userSessions.values()) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            }
        }
    }
}
