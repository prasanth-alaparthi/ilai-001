package com.muse.social.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

/**
 * Client for inter-service communication with muse-notes-service.
 * 
 * Features:
 * - Auto-organize notes into folders ("Headache-Free" folder injection)
 * - Validate note ownership
 * - Create note links
 * - Fetch note metadata
 */
@Component
@Slf4j
public class NotesServiceClient {

    private final WebClient webClient;
    private final Duration timeout;

    public NotesServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${services.notes.url:http://muse-notes-service:8082}") String notesServiceUrl,
            @Value("${services.notes.timeout:5000}") long timeoutMs) {
        this.webClient = webClientBuilder
                .baseUrl(notesServiceUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    /**
     * Auto-organize a note into a folder ("Headache-Free" feature).
     * Creates the folder if it doesn't exist and moves the note into it.
     * 
     * @param userId     User ID from Auth Service
     * @param noteId     Note to organize
     * @param folderName Target folder name (e.g., "Bounty Solutions", "Research")
     * @return true if successful
     */
    public boolean autoOrganizeNote(Long userId, Long noteId, String folderName) {
        try {
            Map<String, Object> response = webClient.post()
                    .uri("/api/notes/{noteId}/organize", noteId)
                    .header("X-User-Id", String.valueOf(userId))
                    .bodyValue(Map.of(
                            "folderName", folderName,
                            "createIfNotExists", true))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();

            log.info("Auto-organized note {} into folder '{}' for user {}",
                    noteId, folderName, userId);
            return true;

        } catch (Exception e) {
            log.warn("Failed to auto-organize note {}: {}", noteId, e.getMessage());
            return false;
        }
    }

    /**
     * Validate that a note exists and belongs to the user.
     * 
     * @param noteId Note ID to validate
     * @param userId User ID from Auth Service
     * @return true if note exists and user has access
     */
    public boolean validateNoteAccess(Long noteId, Long userId) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri("/api/notes/{noteId}", noteId)
                    .header("X-User-Id", String.valueOf(userId))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();

            return response != null && response.containsKey("id");

        } catch (Exception e) {
            log.debug("Note {} not accessible for user {}: {}", noteId, userId, e.getMessage());
            return false;
        }
    }

    /**
     * Create a bi-directional link between two notes.
     * Used when bounty problem note links to solution note.
     * 
     * @param sourceNoteId Source note (problem)
     * @param targetNoteId Target note (solution)
     * @param linkType     Type of link (e.g., "solution", "reference", "related")
     * @param userId       User ID for authorization
     * @return true if link created successfully
     */
    public boolean linkNotes(Long sourceNoteId, Long targetNoteId, String linkType, Long userId) {
        try {
            webClient.post()
                    .uri("/api/notes/{noteId}/link", sourceNoteId)
                    .header("X-User-Id", String.valueOf(userId))
                    .bodyValue(Map.of(
                            "linkedNoteId", targetNoteId,
                            "linkType", linkType,
                            "bidirectional", true))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .timeout(timeout)
                    .block();

            log.info("Linked notes {} → {} (type: {}) for user {}",
                    sourceNoteId, targetNoteId, linkType, userId);
            return true;

        } catch (Exception e) {
            log.warn("Failed to link notes {} → {}: {}",
                    sourceNoteId, targetNoteId, e.getMessage());
            return false;
        }
    }

    /**
     * Get note metadata (title, tags, folder).
     * 
     * @param noteId Note ID
     * @param userId User ID for authorization
     * @return Note metadata map or null if not found
     */
    public Map<String, Object> getNoteMetadata(Long noteId, Long userId) {
        try {
            return webClient.get()
                    .uri("/api/notes/{noteId}/metadata", noteId)
                    .header("X-User-Id", String.valueOf(userId))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();

        } catch (Exception e) {
            log.debug("Failed to get metadata for note {}: {}", noteId, e.getMessage());
            return null;
        }
    }

    /**
     * Create a new note in a specific folder.
     * Used for auto-generating solution templates.
     * 
     * @param userId     User ID
     * @param title      Note title
     * @param content    Initial content (JSON)
     * @param folderName Target folder
     * @return Created note ID or null if failed
     */
    public Long createNoteInFolder(Long userId, String title, Object content, String folderName) {
        try {
            Map<String, Object> response = webClient.post()
                    .uri("/api/notes")
                    .header("X-User-Id", String.valueOf(userId))
                    .bodyValue(Map.of(
                            "title", title,
                            "content", content,
                            "folderName", folderName))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();

            if (response != null && response.containsKey("id")) {
                Long noteId = ((Number) response.get("id")).longValue();
                log.info("Created note {} in folder '{}' for user {}", noteId, folderName, userId);
                return noteId;
            }
            return null;

        } catch (Exception e) {
            log.warn("Failed to create note in folder '{}': {}", folderName, e.getMessage());
            return null;
        }
    }

    /**
     * Tag a note (for categorization).
     */
    public boolean addTagsToNote(Long noteId, Long userId, String... tags) {
        try {
            webClient.post()
                    .uri("/api/notes/{noteId}/tags", noteId)
                    .header("X-User-Id", String.valueOf(userId))
                    .bodyValue(Map.of("tags", tags))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .timeout(timeout)
                    .block();

            return true;

        } catch (Exception e) {
            log.debug("Failed to add tags to note {}: {}", noteId, e.getMessage());
            return false;
        }
    }

    /**
     * Async version of autoOrganizeNote for fire-and-forget operations.
     */
    public Mono<Boolean> autoOrganizeNoteAsync(Long userId, Long noteId, String folderName) {
        return webClient.post()
                .uri("/api/notes/{noteId}/organize", noteId)
                .header("X-User-Id", String.valueOf(userId))
                .bodyValue(Map.of(
                        "folderName", folderName,
                        "createIfNotExists", true))
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(timeout)
                .map(response -> true)
                .onErrorReturn(false)
                .doOnSuccess(success -> {
                    if (success) {
                        log.info("Async organized note {} into '{}'", noteId, folderName);
                    }
                });
    }
}
