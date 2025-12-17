package com.muse.notes.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * Event Publisher for cross-service communication via Redis
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String NOTES_CHANNEL = "notes.events";
    private static final String JOURNAL_CHANNEL = "journal.events";

    /**
     * Publish a note created event
     */
    public void publishNoteCreated(Long userId, Long noteId, String title, String[] topics) {
        Map<String, Object> event = Map.of(
                "type", "note.created",
                "userId", userId,
                "noteId", noteId,
                "title", title,
                "topics", topics != null ? topics : new String[] {},
                "timestamp", Instant.now().toString());
        publish(NOTES_CHANNEL, event);
    }

    /**
     * Publish a note updated event
     */
    public void publishNoteUpdated(Long userId, Long noteId, String title, String[] topics) {
        Map<String, Object> event = Map.of(
                "type", "note.updated",
                "userId", userId,
                "noteId", noteId,
                "title", title,
                "topics", topics != null ? topics : new String[] {},
                "timestamp", Instant.now().toString());
        publish(NOTES_CHANNEL, event);
    }

    /**
     * Publish a note deleted event
     */
    public void publishNoteDeleted(Long userId, Long noteId) {
        Map<String, Object> event = Map.of(
                "type", "note.deleted",
                "userId", userId,
                "noteId", noteId,
                "timestamp", Instant.now().toString());
        publish(NOTES_CHANNEL, event);
    }

    /**
     * Publish a journal entry created event
     */
    public void publishJournalEntryCreated(Long userId, Long entryId, String[] topics) {
        Map<String, Object> event = Map.of(
                "type", "journal.created",
                "userId", userId,
                "entryId", entryId,
                "topics", topics != null ? topics : new String[] {},
                "timestamp", Instant.now().toString());
        publish(JOURNAL_CHANNEL, event);
    }

    /**
     * Publish a flashcard study session event
     */
    public void publishFlashcardStudied(Long userId, String topic, int cardsStudied, double score) {
        Map<String, Object> event = Map.of(
                "type", "flashcard.studied",
                "userId", userId,
                "topic", topic,
                "cardsStudied", cardsStudied,
                "score", score,
                "timestamp", Instant.now().toString());
        publish(NOTES_CHANNEL, event);
    }

    private void publish(String channel, Map<String, Object> event) {
        try {
            redisTemplate.convertAndSend(channel, event);
            log.debug("Published event to {}: {}", channel, event.get("type"));
        } catch (Exception e) {
            log.error("Failed to publish event to {}: {}", channel, e.getMessage());
        }
    }
}
