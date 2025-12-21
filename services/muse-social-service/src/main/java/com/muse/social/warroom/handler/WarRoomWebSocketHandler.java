package com.muse.social.warroom.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.social.warroom.dto.*;
import com.muse.social.warroom.entity.RoomVariable;
import com.muse.social.warroom.service.WarRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for Study War Rooms.
 * Implements Vector Clock-based CRDT for variable synchronization.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WarRoomWebSocketHandler extends TextWebSocketHandler {

    private final WarRoomService warRoomService;
    private final ObjectMapper objectMapper;

    // Room ID -> Set of sessions
    private final Map<Long, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    // Session ID -> Room ID
    private final Map<String, Long> sessionRoomMap = new ConcurrentHashMap<>();

    // Session ID -> User ID
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.debug("WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            WarRoomMessage msg = objectMapper.readValue(
                    message.getPayload(), WarRoomMessage.class);

            switch (msg.getType()) {
                case "join":
                    handleJoin(session, msg);
                    break;
                case "leave":
                    handleLeave(session);
                    break;
                case "variable_update":
                    handleVariableUpdate(session, msg);
                    break;
                case "sync_request":
                    handleSyncRequest(session, msg);
                    break;
                case "chat":
                    handleChat(session, msg);
                    break;
                default:
                    log.warn("Unknown message type: {}", msg.getType());
            }

        } catch (Exception e) {
            log.error("Error handling message: {}", e.getMessage());
            sendError(session, e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        handleLeave(session);
        log.debug("WebSocket connection closed: {}", session.getId());
    }

    /**
     * Handle user joining a room.
     */
    private void handleJoin(WebSocketSession session, WarRoomMessage msg) throws IOException {
        Long roomId = msg.getRoomId();
        Long userId = msg.getUserId();

        // Store session mapping
        sessionRoomMap.put(session.getId(), roomId);
        sessionUserMap.put(session.getId(), userId);

        // Add to room sessions
        roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet())
                .add(session);

        // Get current room state
        List<RoomVariable> variables = warRoomService.getRoomVariables(roomId);

        // Send current state to new user
        WarRoomMessage response = WarRoomMessage.builder()
                .type("room_state")
                .roomId(roomId)
                .variables(variables.stream()
                        .map(this::toVariableDto)
                        .toList())
                .build();

        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));

        // Broadcast user joined
        broadcast(roomId, WarRoomMessage.builder()
                .type("user_joined")
                .roomId(roomId)
                .userId(userId)
                .timestamp(System.currentTimeMillis())
                .build(), session);

        log.info("User {} joined room {}", userId, roomId);
    }

    /**
     * Handle user leaving a room.
     */
    private void handleLeave(WebSocketSession session) {
        Long roomId = sessionRoomMap.remove(session.getId());
        Long userId = sessionUserMap.remove(session.getId());

        if (roomId != null) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);

                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }

            // Broadcast user left
            if (userId != null) {
                broadcast(roomId, WarRoomMessage.builder()
                        .type("user_left")
                        .roomId(roomId)
                        .userId(userId)
                        .timestamp(System.currentTimeMillis())
                        .build(), null);
            }
        }
    }

    /**
     * Handle variable update with Vector Clock conflict resolution.
     */
    private void handleVariableUpdate(WebSocketSession session, WarRoomMessage msg) {
        Long roomId = sessionRoomMap.get(session.getId());
        Long userId = sessionUserMap.get(session.getId());

        if (roomId == null || userId == null) {
            sendError(session, "Not in a room");
            return;
        }

        VariableUpdateDto update = msg.getVariableUpdate();

        // Apply update with conflict resolution
        RoomVariable resolved = warRoomService.updateVariable(
                roomId,
                userId,
                update.getSymbol(),
                update.getValue(),
                update.getUnit(),
                update.getVectorClock(),
                update.getSource(),
                update.isVerified());

        // Broadcast resolved update to all participants
        WarRoomMessage broadcast = WarRoomMessage.builder()
                .type("variable_updated")
                .roomId(roomId)
                .variableUpdate(VariableUpdateDto.builder()
                        .symbol(resolved.getSymbol())
                        .value(resolved.getValue())
                        .unit(resolved.getUnit())
                        .vectorClock(resolved.getVectorClock())
                        .updatedBy(resolved.getLastUpdatedBy())
                        .source(resolved.getSource())
                        .verified(resolved.getIsVerified())
                        .build())
                .timestamp(System.currentTimeMillis())
                .build();

        broadcast(roomId, broadcast, null);
    }

    /**
     * Handle sync request (for reconnection).
     */
    private void handleSyncRequest(WebSocketSession session, WarRoomMessage msg) throws IOException {
        Long roomId = msg.getRoomId();

        List<RoomVariable> variables = warRoomService.getRoomVariables(roomId);

        WarRoomMessage response = WarRoomMessage.builder()
                .type("sync_response")
                .roomId(roomId)
                .variables(variables.stream()
                        .map(this::toVariableDto)
                        .toList())
                .timestamp(System.currentTimeMillis())
                .build();

        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
    }

    /**
     * Handle chat message.
     */
    private void handleChat(WebSocketSession session, WarRoomMessage msg) {
        Long roomId = sessionRoomMap.get(session.getId());
        Long userId = sessionUserMap.get(session.getId());

        if (roomId == null)
            return;

        WarRoomMessage chatBroadcast = WarRoomMessage.builder()
                .type("chat")
                .roomId(roomId)
                .userId(userId)
                .content(msg.getContent())
                .timestamp(System.currentTimeMillis())
                .build();

        broadcast(roomId, chatBroadcast, null);
    }

    /**
     * Broadcast message to all room participants.
     */
    private void broadcast(Long roomId, WarRoomMessage message, WebSocketSession exclude) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null)
            return;

        String json;
        try {
            json = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("Failed to serialize message: {}", e.getMessage());
            return;
        }

        for (WebSocketSession session : sessions) {
            if (session.isOpen() && !session.equals(exclude)) {
                try {
                    session.sendMessage(new TextMessage(json));
                } catch (IOException e) {
                    log.warn("Failed to send to session {}: {}",
                            session.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Send error message to session.
     */
    private void sendError(WebSocketSession session, String error) {
        try {
            WarRoomMessage errorMsg = WarRoomMessage.builder()
                    .type("error")
                    .error(error)
                    .timestamp(System.currentTimeMillis())
                    .build();

            session.sendMessage(new TextMessage(
                    objectMapper.writeValueAsString(errorMsg)));
        } catch (IOException e) {
            log.error("Failed to send error: {}", e.getMessage());
        }
    }

    private VariableUpdateDto toVariableDto(RoomVariable var) {
        return VariableUpdateDto.builder()
                .symbol(var.getSymbol())
                .value(var.getValue())
                .unit(var.getUnit())
                .vectorClock(var.getVectorClock())
                .updatedBy(var.getLastUpdatedBy())
                .source(var.getSource())
                .verified(var.getIsVerified())
                .build();
    }

    /**
     * Get active user count in a room.
     */
    public int getRoomUserCount(Long roomId) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        return sessions != null ? sessions.size() : 0;
    }
}
