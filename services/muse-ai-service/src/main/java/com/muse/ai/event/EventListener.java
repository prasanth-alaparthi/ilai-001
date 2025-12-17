package com.muse.ai.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.muse.ai.service.PersonalizationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Listens to events from other services via Redis pub/sub
 * and triggers appropriate AI/personalization actions.
 */
@Component
@Slf4j
public class EventListener {

    @Autowired
    private PersonalizationService personalizationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Handle events from Notes service
     * Events: note.created, note.updated, note.deleted
     */
    public void handleNotesEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("type").asText();
            Long userId = event.path("userId").asLong();

            log.info("Received notes event: {} for user {}", eventType, userId);

            switch (eventType) {
                case "note.created":
                    String[] topics = extractTopics(event.path("content").asText());
                    personalizationService.updateTopicInterests(userId, topics);
                    personalizationService.incrementModuleUsage(userId, "notes");
                    break;
                case "note.saved":
                    personalizationService.incrementModuleUsage(userId, "notes");
                    break;
                default:
                    log.debug("Unhandled notes event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing notes event: {}", e.getMessage());
        }
    }

    /**
     * Handle events from Feed service
     * Events: feed.read, feed.saved, feed.shared
     */
    public void handleFeedEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("type").asText();
            Long userId = event.path("userId").asLong();

            log.info("Received feed event: {} for user {}", eventType, userId);

            switch (eventType) {
                case "feed.read":
                    String category = event.path("category").asText();
                    personalizationService.updateTopicInterests(userId, new String[] { category });
                    personalizationService.incrementModuleUsage(userId, "feed");
                    break;
                case "feed.saved":
                    personalizationService.incrementModuleUsage(userId, "feed");
                    break;
                default:
                    log.debug("Unhandled feed event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing feed event: {}", e.getMessage());
        }
    }

    /**
     * Handle events from Classroom service
     * Events: assignment.submitted, quiz.completed, assignment.graded
     */
    public void handleClassroomEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("type").asText();
            Long userId = event.path("userId").asLong();

            log.info("Received classroom event: {} for user {}", eventType, userId);

            switch (eventType) {
                case "quiz.completed":
                    String subject = event.path("subject").asText();
                    double score = event.path("score").asDouble();
                    personalizationService.updateSkillLevel(userId, subject, score);
                    personalizationService.incrementModuleUsage(userId, "classroom");
                    break;
                case "assignment.submitted":
                    personalizationService.incrementModuleUsage(userId, "classroom");
                    break;
                default:
                    log.debug("Unhandled classroom event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing classroom event: {}", e.getMessage());
        }
    }

    /**
     * Handle events from User/Auth service
     * Events: user.login, user.profile.updated
     */
    public void handleUserEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("type").asText();
            Long userId = event.path("userId").asLong();

            log.info("Received user event: {} for user {}", eventType, userId);

            switch (eventType) {
                case "user.login":
                    personalizationService.ensureProfileExists(userId);
                    break;
                default:
                    log.debug("Unhandled user event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing user event: {}", e.getMessage());
        }
    }

    /**
     * Simple topic extraction from content (can be enhanced with NLP)
     */
    private String[] extractTopics(String content) {
        // Simple implementation - in production use NLP/AI
        if (content == null || content.isEmpty()) {
            return new String[] {};
        }
        // For now, just extract first 3 significant words
        String[] words = content.toLowerCase().split("\\s+");
        return java.util.Arrays.stream(words)
                .filter(w -> w.length() > 4)
                .limit(3)
                .toArray(String[]::new);
    }
}
