package com.muse.ai.automation;

import com.muse.ai.service.LLMRouterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.util.*;

/**
 * Notes Module Automation
 * Defines all automated actions for the notes module
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NoteAutomation {

    private final AutomationEngine automationEngine;
    private final LLMRouterService llmRouterService;
    private final WebClient.Builder webClientBuilder;

    @Value("${muse.notes-service.url:http://muse-notes-service:8082}")
    private String notesServiceUrl;

    @PostConstruct
    public void registerAutomations() {
        log.info("Registering Notes module automations...");

        // Auto-generate tags on note creation
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("notes.auto-tag")
                .description("Automatically generate tags from note content")
                .triggerEvent("note.created")
                .action(this::autoGenerateTags)
                .build());

        // Auto-summarize long notes
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("notes.auto-summarize")
                .description("Auto-summarize notes longer than 500 words")
                .triggerEvent("note.updated")
                .conditions(Map.of("contentLengthOver", 500))
                .action(this::autoSummarize)
                .build());

        // Suggest linked notes
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("notes.suggest-links")
                .description("Suggest related notes to link")
                .triggerEvent("note.created")
                .action(this::suggestLinks)
                .build());

        // Generate embeddings for semantic search
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("notes.generate-embedding")
                .description("Generate embedding vector for semantic search")
                .triggerEvent("note.created")
                .action(this::generateEmbedding)
                .build());

        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("notes.generate-embedding-update")
                .description("Update embedding when note content changes")
                .triggerEvent("note.updated")
                .action(this::generateEmbedding)
                .build());

        // Auto-format messy notes
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("notes.auto-format")
                .description("Clean up and format note structure")
                .triggerEvent("note.saved")
                .action(this::autoFormat)
                .build());

        log.info("Registered {} Notes automation rules", 6);
    }

    // ============== Automation Actions ==============

    private void autoGenerateTags(Map<String, Object> event) {
        Long noteId = getLong(event, "noteId");
        String content = getString(event, "content");
        Long userId = getLong(event, "userId");

        if (content == null || content.length() < 50)
            return;

        String prompt = """
                Extract 3-5 relevant tags from this note content.
                Return ONLY a JSON array of lowercase tags.

                Content: %s

                Response format: ["tag1", "tag2", "tag3"]
                """.formatted(content.substring(0, Math.min(content.length(), 1000)));

        llmRouterService.generateContent(prompt, "json")
                .subscribe(response -> {
                    log.info("Auto-generated tags for note {}: {}", noteId, response);
                    // TODO: Update note with tags via notes-service API
                });
    }

    private void autoSummarize(Map<String, Object> event) {
        Long noteId = getLong(event, "noteId");
        String content = getString(event, "content");

        if (content == null || content.split("\\s+").length < 500)
            return;

        llmRouterService.summarize(content)
                .subscribe(summary -> {
                    log.info("Auto-generated summary for note {}", noteId);
                    // TODO: Save summary via notes-service API
                });
    }

    private void suggestLinks(Map<String, Object> event) {
        Long noteId = getLong(event, "noteId");
        Long userId = getLong(event, "userId");
        String content = getString(event, "content");

        if (content == null || content.length() < 100)
            return;

        // Call notes service to find similar notes
        webClientBuilder.build()
                .get()
                .uri(notesServiceUrl + "/api/notes/semantic-search?q={query}&limit=5",
                        content.substring(0, Math.min(100, content.length())))
                .header("X-User-Id", userId != null ? userId.toString() : "0")
                .retrieve()
                .bodyToMono(List.class)
                .subscribe(relatedNotes -> {
                    log.info("Found {} related notes for linking to note {}",
                            relatedNotes.size(), noteId);
                    // TODO: Store link suggestions for user to review
                });
    }

    private void generateEmbedding(Map<String, Object> event) {
        Long noteId = getLong(event, "noteId");
        String content = getString(event, "content");

        log.debug("Generating embedding for note {}", noteId);
        // Embedding generation is handled by notes-service directly
        // This automation just logs the event
    }

    private void autoFormat(Map<String, Object> event) {
        Long noteId = getLong(event, "noteId");
        String content = getString(event, "content");

        if (content == null)
            return;

        // Simple formatting checks
        // TODO: Implement more sophisticated formatting
        log.debug("Checking format for note {}", noteId);
    }

    // ============== Helpers ==============

    private Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Long)
            return (Long) value;
        if (value instanceof Integer)
            return ((Integer) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }
}
