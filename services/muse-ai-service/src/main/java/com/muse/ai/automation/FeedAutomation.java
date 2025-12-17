package com.muse.ai.automation;

import com.muse.ai.service.LLMRouterService;
import com.muse.ai.service.PersonalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;

/**
 * Feed Module Automation
 * Automates feed curation, summarization, and personalization
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeedAutomation {

    private final AutomationEngine automationEngine;
    private final LLMRouterService llmRouterService;
    private final PersonalizationService personalizationService;

    @PostConstruct
    public void registerAutomations() {
        log.info("Registering Feed module automations...");

        // Track reading interests
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("feed.track-interest")
                .description("Update user interests based on articles read")
                .triggerEvent("feed.article.read")
                .action(this::trackReadingInterest)
                .build());

        // Auto-summarize saved articles
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("feed.auto-summarize")
                .description("Automatically summarize saved articles")
                .triggerEvent("feed.article.saved")
                .action(this::autoSummarizeArticle)
                .build());

        // Generate embeddings for articles
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("feed.generate-embedding")
                .description("Generate embedding for semantic search")
                .triggerEvent("feed.article.saved")
                .action(this::generateEmbedding)
                .build());

        // Curate personalized feed
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("feed.curate")
                .description("Filter and rank articles based on interests")
                .triggerEvent("feed.refresh")
                .action(this::curateFeed)
                .build());

        log.info("Registered {} Feed automation rules", 4);
    }

    private void trackReadingInterest(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        String topic = getString(event, "topic");
        String category = getString(event, "category");

        if (userId == null)
            return;

        Map<String, Object> activity = Map.of(
                "type", "feed_read",
                "topic", topic != null ? topic : "general",
                "category", category != null ? category : "article");

        personalizationService.recordActivity(userId, activity);
        log.debug("Tracked reading interest for user {}: {}", userId, topic);
    }

    private void autoSummarizeArticle(Map<String, Object> event) {
        Long articleId = getLong(event, "articleId");
        String content = getString(event, "content");

        if (content == null || content.length() < 200)
            return;

        llmRouterService.summarize(content)
                .subscribe(summary -> {
                    log.info("Auto-summarized article {}", articleId);
                    // TODO: Store summary with article
                });
    }

    private void generateEmbedding(Map<String, Object> event) {
        Long articleId = getLong(event, "articleId");
        log.debug("Generating embedding for article {}", articleId);
        // Feed service handles embedding generation
    }

    private void curateFeed(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        if (userId == null)
            return;

        Map<String, Object> recommendations = personalizationService.getRecommendations(userId);
        log.debug("Curating feed for user {} with preferences: {}",
                userId, recommendations.get("topTopics"));
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
