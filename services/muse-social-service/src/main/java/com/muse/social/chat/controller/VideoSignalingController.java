package com.muse.social.chat.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebRTC Signaling Controller for Video Calls
 * Handles offer/answer exchange and ICE candidate forwarding
 */
@Controller
public class VideoSignalingController {

    private static final Logger log = LoggerFactory.getLogger(VideoSignalingController.class);

    private final SimpMessagingTemplate messagingTemplate;

    // Track users in each room
    private final Map<String, ConcurrentHashMap<String, String>> rooms = new ConcurrentHashMap<>();

    public VideoSignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * User joins a video call room
     */
    @MessageMapping("/video/join/{roomId}")
    @SendTo("/topic/video/{roomId}")
    public Map<String, Object> joinRoom(
            @DestinationVariable String roomId,
            Map<String, String> payload) {

        String userName = payload.getOrDefault("userName", "User");
        String peerId = payload.get("peerId");

        rooms.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        rooms.get(roomId).put(peerId, userName);

        log.info("User {} joined room {}", userName, roomId);

        return Map.of(
                "type", "user-joined",
                "user", Map.of("id", peerId, "name", userName),
                "participants", rooms.get(roomId).size());
    }

    /**
     * Forward WebRTC offer to the room
     */
    @MessageMapping("/video/offer/{roomId}")
    @SendTo("/topic/video/{roomId}")
    public Map<String, Object> handleOffer(
            @DestinationVariable String roomId,
            Map<String, Object> offer) {

        log.debug("Forwarding offer in room {}", roomId);

        return Map.of(
                "type", "offer",
                "offer", offer.get("offer"),
                "from", offer.get("from"));
    }

    /**
     * Forward WebRTC answer to the room
     */
    @MessageMapping("/video/answer/{roomId}")
    @SendTo("/topic/video/{roomId}")
    public Map<String, Object> handleAnswer(
            @DestinationVariable String roomId,
            Map<String, Object> answer) {

        log.debug("Forwarding answer in room {}", roomId);

        return Map.of(
                "type", "answer",
                "answer", answer.get("answer"),
                "from", answer.get("from"));
    }

    /**
     * Forward ICE candidate to the room
     */
    @MessageMapping("/video/ice-candidate/{roomId}")
    @SendTo("/topic/video/{roomId}")
    public Map<String, Object> handleIceCandidate(
            @DestinationVariable String roomId,
            Map<String, Object> candidateData) {

        log.debug("Forwarding ICE candidate in room {}", roomId);

        return Map.of(
                "type", "ice-candidate",
                "candidate", candidateData.get("candidate"),
                "from", candidateData.get("from"));
    }

    /**
     * User leaves a video call room
     */
    @MessageMapping("/video/leave/{roomId}")
    @SendTo("/topic/video/{roomId}")
    public Map<String, Object> leaveRoom(
            @DestinationVariable String roomId,
            Map<String, String> payload) {

        String peerId = payload.get("peerId");

        if (rooms.containsKey(roomId)) {
            rooms.get(roomId).remove(peerId);
            if (rooms.get(roomId).isEmpty()) {
                rooms.remove(roomId);
            }
        }

        log.info("User {} left room {}", peerId, roomId);

        return Map.of(
                "type", "user-left",
                "userId", peerId);
    }

    /**
     * Handle in-call chat messages
     */
    @MessageMapping("/video/chat/{roomId}")
    @SendTo("/topic/video/{roomId}")
    public Map<String, Object> handleChatMessage(
            @DestinationVariable String roomId,
            Map<String, Object> message) {

        log.debug("Chat message in room {}: {}", roomId, message.get("text"));

        return Map.of(
                "type", "chat",
                "message", message);
    }
}
