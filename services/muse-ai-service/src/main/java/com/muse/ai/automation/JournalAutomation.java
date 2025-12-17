package com.muse.ai.automation;

import com.muse.ai.service.LLMRouterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;

/**
 * Journal Module Automation
 * Automates mood analysis, insights, and prompts
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JournalAutomation {

    private final AutomationEngine automationEngine;
    private final LLMRouterService llmRouterService;

    @PostConstruct
    public void registerAutomations() {
        log.info("Registering Journal module automations...");

        // Analyze mood from journal entry
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("journal.analyze-mood")
                .description("Analyze mood and sentiment from entry")
                .triggerEvent("journal.entry.created")
                .action(this::analyzeMood)
                .build());

        // Extract gratitudes
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("journal.extract-gratitudes")
                .description("Extract gratitude items from entry")
                .triggerEvent("journal.entry.created")
                .action(this::extractGratitudes)
                .build());

        // Generate weekly insights
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("journal.weekly-insights")
                .description("Generate insights from week's entries")
                .triggerEvent("schedule.weekly")
                .action(this::generateWeeklyInsights)
                .build());

        // Generate embedding for semantic search
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("journal.generate-embedding")
                .description("Generate embedding for entry")
                .triggerEvent("journal.entry.created")
                .action(this::generateEmbedding)
                .build());

        log.info("Registered {} Journal automation rules", 4);
    }

    private void analyzeMood(Map<String, Object> event) {
        Long entryId = getLong(event, "entryId");
        String content = getString(event, "highlights");

        if (content == null)
            return;

        String prompt = """
                Analyze the mood/sentiment of this journal entry.
                Return JSON: {"mood": "happy|sad|anxious|calm|excited|neutral", "confidence": 0.0-1.0}

                Entry: %s
                """.formatted(content.substring(0, Math.min(500, content.length())));

        llmRouterService.generateContent(prompt, "json")
                .subscribe(response -> {
                    log.info("Analyzed mood for entry {}: {}", entryId, response);
                    // TODO: Update entry with analyzed mood
                });
    }

    private void extractGratitudes(Map<String, Object> event) {
        String highlights = getString(event, "highlights");
        Long entryId = getLong(event, "entryId");

        if (highlights == null)
            return;

        String prompt = """
                Extract any expressions of gratitude from this journal entry.
                Return JSON array: ["gratitude1", "gratitude2"]
                If none found, return empty array: []

                Entry: %s
                """.formatted(highlights);

        llmRouterService.generateContent(prompt, "json")
                .subscribe(response -> {
                    log.info("Extracted gratitudes for entry {}: {}", entryId, response);
                    // TODO: Store extracted gratitudes
                });
    }

    private void generateWeeklyInsights(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        log.info("Generating weekly insights for user {}", userId);
        // TODO: Fetch week's entries and generate insights
    }

    private void generateEmbedding(Map<String, Object> event) {
        Long entryId = getLong(event, "entryId");
        log.debug("Generating embedding for journal entry {}", entryId);
    }

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
