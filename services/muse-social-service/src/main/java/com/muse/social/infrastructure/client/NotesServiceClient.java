package com.muse.social.infrastructure.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Notes Service Client with Resilience4j protection.
 * 
 * Features:
 * - Circuit Breaker: Prevents cascading failures
 * - Retry: Handles transient failures
 * - Time Limiter: Prevents hanging requests
 * 
 * Used by:
 * - BountyService: Validate/link notes
 * - NoteShareOrchestrator: D2F folder injection
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

    // ==================== D2F (Direct-to-Folder) Methods ====================

    /**
     * Create or find a folder for the user.
     * 
     * @param userId         Target user
     * @param folderName     Folder name (e.g., "Shared Notes")
     * @param parentFolderId Optional parent folder ID
     * @return Folder ID or null if failed
     */
    @CircuitBreaker(name = "notesService", fallbackMethod = "createFolderFallback")
    @Retry(name = "notesService")
    public Long createOrFindFolder(Long userId, String folderName, Long parentFolderId) {
        try {
            Map<String, Object> response = webClient.post()
                    .uri("/api/notebooks/folders/find-or-create")
                    .header("X-User-Id", String.valueOf(userId))
                    .bodyValue(Map.of(
                            "name", folderName,
                            "parentId", parentFolderId != null ? parentFolderId : 0,
                            "createIfNotExists", true))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();

            if (response != null && response.containsKey("id")) {
                return ((Number) response.get("id")).longValue();
            }
            return null;

        } catch (Exception e) {
            log.warn("Failed to create/find folder '{}' for user {}: {}",
                    folderName, userId, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unused")
    private Long createFolderFallback(Long userId, String folderName, Long parentFolderId, Throwable t) {
        log.warn("Circuit breaker triggered for createOrFindFolder: {}", t.getMessage());
        return null;
    }

    /**
     * Inject a shared note into a target folder.
     * Creates a reference/link to the note in the target user's folder.
     * 
     * @param targetUserId   User receiving the share
     * @param sourceNoteId   Note being shared
     * @param targetFolderId Folder to inject into
     * @param sourceUserId   User sharing the note
     * @return true if successful
     */
    @CircuitBreaker(name = "notesService", fallbackMethod = "injectNoteFallback")
    @Retry(name = "notesService")
    public boolean injectSharedNoteToFolder(Long targetUserId, Long sourceNoteId,
            Long targetFolderId, Long sourceUserId) {
        try {
            webClient.post()
                    .uri("/api/notes/share/inject")
                    .header("X-User-Id", String.valueOf(targetUserId))
                    .bodyValue(Map.of(
                            "sourceNoteId", sourceNoteId,
                            "targetFolderId", targetFolderId,
                            "sharedByUserId", sourceUserId,
                            "copyMode", "reference" // Don't duplicate, just link
                    ))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .timeout(timeout)
                    .block();

            log.info("Injected note {} into folder {} for user {}",
                    sourceNoteId, targetFolderId, targetUserId);
            return true;

        } catch (Exception e) {
            log.warn("Failed to inject note {}: {}", sourceNoteId, e.getMessage());
            return false;
        }
    }

    /**
     * Inject a shared note into a target folder via internal API.
     * Part of the "Bounty-to-Folder" solve logic.
     * 
     * @param recipientId    User receiving the note
     * @param noteId         Note being shared
     * @param folderName     Parent folder or sub-folder name
     * @param senderUsername Username of the person sharing
     */
    public Mono<Void> injectSharedNote(Long recipientId, Long noteId, String folderName, String senderUsername) {
        log.info("Requesting internal D2F injection for user {}'s note {} into recipient {}'s folder '{}'",
                senderUsername, noteId, recipientId, folderName);

        return webClient.post()
                .uri("/api/internal/organize-shared")
                .header("X-Internal-Secret", "AI_PLATFORM_SECRET") // Example internal auth
                .bodyValue(Map.of(
                        "recipientId", recipientId,
                        "noteId", noteId,
                        "folderName", folderName,
                        "senderUsername", senderUsername,
                        "metadata", Map.of("trigger", "bounty_solve", "at", Instant.now().toString())))
                .retrieve()
                .bodyToMono(Void.class)
                .timeout(timeout)
                .doOnError(e -> log.error("D2F internal injection failed: {}", e.getMessage()));
    }

    @SuppressWarnings("unused")
    private boolean injectNoteFallback(Long targetUserId, Long sourceNoteId,
            Long targetFolderId, Long sourceUserId, Throwable t) {
        log.warn("Circuit breaker triggered for injectSharedNote: {}", t.getMessage());
        return false;
    }

    // ==================== Validation Methods ====================

    /**
     * Validate that a note exists and user has access.
     */
    @CircuitBreaker(name = "notesService", fallbackMethod = "validateAccessFallback")
    @Retry(name = "notesService")
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

        } catch (WebClientResponseException.NotFound e) {
            return false;
        } catch (Exception e) {
            log.debug("Note access check failed for {}: {}", noteId, e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unused")
    private boolean validateAccessFallback(Long noteId, Long userId, Throwable t) {
        log.warn("Circuit breaker triggered for validateNoteAccess: {}", t.getMessage());
        // Fail open for validation - allow operation to proceed
        return true;
    }

    // ==================== Linking Methods ====================

    /**
     * Create bi-directional link between notes (problem ↔ solution).
     */
    @CircuitBreaker(name = "notesService", fallbackMethod = "linkNotesFallback")
    @Retry(name = "notesService")
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

            log.info("Linked notes {} ↔ {} (type: {})", sourceNoteId, targetNoteId, linkType);
            return true;

        } catch (Exception e) {
            log.warn("Failed to link notes: {}", e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unused")
    private boolean linkNotesFallback(Long sourceNoteId, Long targetNoteId,
            String linkType, Long userId, Throwable t) {
        log.warn("Circuit breaker triggered for linkNotes: {}", t.getMessage());
        return false;
    }

    // ==================== Organization Methods ====================

    /**
     * Auto-organize note into folder (async).
     */
    @CircuitBreaker(name = "notesService")
    public CompletableFuture<Boolean> autoOrganizeNoteAsync(Long userId, Long noteId, String folderName) {
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
                .toFuture();
    }

    /**
     * Get note metadata.
     */
    @CircuitBreaker(name = "notesService", fallbackMethod = "getMetadataFallback")
    @Retry(name = "notesService")
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
            log.debug("Failed to get note metadata: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unused")
    private Map<String, Object> getMetadataFallback(Long noteId, Long userId, Throwable t) {
        return null;
    }
}
