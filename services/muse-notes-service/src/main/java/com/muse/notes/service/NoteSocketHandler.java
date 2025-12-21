package com.muse.notes.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
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
public class NoteSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(NoteSocketHandler.class);
    private final Map<String, List<WebSocketSession>> noteRooms = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToNoteId = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Principal principal = (Principal) session.getAttributes().get("user");
        if (principal == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("User not authenticated."));
            return;
        }

        String noteId = getNoteId(session);
        if (noteId == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Note ID is required."));
            return;
        }

        logger.info("User '{}' connected to note '{}'. Session ID: {}", principal.getName(), noteId, session.getId());
        noteRooms.computeIfAbsent(noteId, k -> new CopyOnWriteArrayList<>()).add(session);
        sessionToNoteId.put(session.getId(), noteId);

        Map<String, Object> joinMessage = Map.of(
                "type", "user_joined",
                "username", principal.getName(),
                "sessionId", session.getId());
        broadcast(noteId, objectMapper.writeValueAsString(joinMessage), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String noteId = getNoteId(session);
        broadcast(noteId, message.getPayload(), session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String noteId = sessionToNoteId.remove(session.getId());
        if (noteId != null) {
            List<WebSocketSession> sessions = noteRooms.get(noteId);
            if (sessions != null) {
                sessions.remove(session);
                Principal principal = (Principal) session.getAttributes().get("user");
                String username = principal != null ? principal.getName() : "Unknown";
                logger.info("User '{}' disconnected from note '{}'.", username, noteId);

                Map<String, Object> leaveMessage = Map.of(
                        "type", "user_left",
                        "username", username,
                        "sessionId", session.getId());
                broadcast(noteId, objectMapper.writeValueAsString(leaveMessage), null);
            }
        }
    }

    public void broadcast(String noteId, String message, WebSocketSession originatorSession) throws IOException {
        List<WebSocketSession> sessions = noteRooms.get(noteId);
        if (sessions != null) {
            for (WebSocketSession webSocketSession : sessions) {
                if (webSocketSession.isOpen()
                        && (originatorSession == null || !originatorSession.getId().equals(webSocketSession.getId()))) {
                    webSocketSession.sendMessage(new TextMessage(message));
                }
            }
        }
    }

    public void broadcastToUser(String username, String message) {
        logger.info("Broadcasting global message to user '{}': {}", username, message);
        noteRooms.values().forEach(sessions -> {
            for (WebSocketSession session : sessions) {
                Principal principal = (Principal) session.getAttributes().get("user");
                if (session.isOpen() && principal != null && username.equals(principal.getName())) {
                    try {
                        session.sendMessage(new TextMessage(message));
                    } catch (IOException e) {
                        logger.error("Failed to send message to user {}: {}", username, e.getMessage());
                    }
                }
            }
        });
    }

    private String getNoteId(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && "noteId".equals(pair[0])) {
                    return pair[1];
                }
            }
        }
        return null;
    }
}
