package com.muse.ai.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Publishes events to Redis pub/sub for other services to consume
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Publish an event to a specific channel
     */
    public void publish(String channel, Map<String, Object> event) {
        try {
            redisTemplate.convertAndSend(channel, event);
            log.info("Published event to {}: {}", channel, event.get("type"));
        } catch (Exception e) {
            log.error("Failed to publish event to {}: {}", channel, e.getMessage());
        }
    }

    /**
     * Publish a notes-related event
     */
    public void publishNotesEvent(String type, Long userId, Map<String, Object> data) {
        Map<String, Object> event = Map.of(
                "type", type,
                "userId", userId,
                "data", data,
                "timestamp", System.currentTimeMillis());
        publish("events:notes", event);
    }

    /**
     * Publish a feed-related event
     */
    public void publishFeedEvent(String type, Long userId, Map<String, Object> data) {
        Map<String, Object> event = Map.of(
                "type", type,
                "userId", userId,
                "data", data,
                "timestamp", System.currentTimeMillis());
        publish("events:feed", event);
    }

    /**
     * Publish a classroom-related event
     */
    public void publishClassroomEvent(String type, Long userId, Map<String, Object> data) {
        Map<String, Object> event = Map.of(
                "type", type,
                "userId", userId,
                "data", data,
                "timestamp", System.currentTimeMillis());
        publish("events:classroom", event);
    }

    /**
     * Publish an AI-related event (for agent status updates, etc.)
     */
    public void publishAiEvent(String type, Long userId, Map<String, Object> data) {
        Map<String, Object> event = Map.of(
                "type", type,
                "userId", userId,
                "data", data,
                "timestamp", System.currentTimeMillis());
        publish("events:ai", event);
    }
}
