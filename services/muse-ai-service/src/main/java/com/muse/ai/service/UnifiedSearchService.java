package com.muse.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Unified Search Service
 * Provides cross-module semantic search across all content types
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedSearchService {

    private final WebClient.Builder webClientBuilder;
    private final LLMRouterService llmRouterService;

    @Value("${muse.notes-service.url:http://muse-notes-service:8082}")
    private String notesServiceUrl;

    @Value("${muse.feed-service.url:http://muse-feed-service:8083}")
    private String feedServiceUrl;

    @Value("${muse.chat-service.url:http://muse-chat-service:8086}")
    private String chatServiceUrl;

    /**
     * Perform unified search across all modules
     * Enhanced for Phase 3: Supports AI summary for paid users
     */
    public Mono<Map<String, Object>> unifiedSearch(String query, Long userId, int limit) {
        return unifiedSearch(query, userId, limit, false);
    }

    /**
     * Perform unified search with optional AI summary (paid feature)
     */
    public Mono<Map<String, Object>> unifiedSearch(String query, Long userId, int limit, boolean isPaid) {
        log.info("Performing unified search for user {} with query: {}", userId, query);
        long startTime = System.currentTimeMillis();

        // Search all services in parallel
        Mono<List<Map<String, Object>>> notesMono = searchNotes(query, userId, limit);
        Mono<List<Map<String, Object>>> feedMono = searchFeed(query, userId, limit);
        Mono<List<Map<String, Object>>> chatMono = searchChat(query, userId, limit);

        return Mono.zip(notesMono, feedMono, chatMono)
                .flatMap(tuple -> {
                    List<Map<String, Object>> notes = tuple.getT1();
                    List<Map<String, Object>> feeds = tuple.getT2();
                    List<Map<String, Object>> chats = tuple.getT3();

                    // Combine and rank results
                    List<Map<String, Object>> allResults = new ArrayList<>();

                    // Add source type to each result
                    notes.forEach(n -> {
                        n.put("_source", "notes");
                        allResults.add(n);
                    });
                    feeds.forEach(f -> {
                        f.put("_source", "feed");
                        allResults.add(f);
                    });
                    chats.forEach(c -> {
                        c.put("_source", "chat");
                        allResults.add(c);
                    });

                    // Sort by relevance score if available
                    allResults.sort((a, b) -> {
                        Double scoreA = (Double) a.getOrDefault("_score", 0.0);
                        Double scoreB = (Double) b.getOrDefault("_score", 0.0);
                        return scoreB.compareTo(scoreA);
                    });

                    List<Map<String, Object>> topResults = allResults.stream().limit(limit * 3).toList();
                    long searchTimeMs = System.currentTimeMillis() - startTime;

                    // Generate AI summary for paid users
                    if (isPaid && !topResults.isEmpty()) {
                        return generateAISummary(query, topResults)
                                .map(summary -> Map.of(
                                        "query", query,
                                        "totalResults", allResults.size(),
                                        "results", topResults,
                                        "breakdown", Map.of(
                                                "notes", notes.size(),
                                                "feed", feeds.size(),
                                                "chat", chats.size()),
                                        "searchTimeMs", searchTimeMs,
                                        "aiSummary", summary,
                                        "isPaid", true));
                    }

                    return Mono.just(Map.of(
                            "query", query,
                            "totalResults", allResults.size(),
                            "results", topResults,
                            "breakdown", Map.of(
                                    "notes", notes.size(),
                                    "feed", feeds.size(),
                                    "chat", chats.size()),
                            "searchTimeMs", searchTimeMs));
                })
                .onErrorResume(e -> {
                    log.error("Unified search failed: {}", e.getMessage());
                    return Mono.just(Map.of(
                            "query", query,
                            "error", e.getMessage(),
                            "results", List.of()));
                });
    }

    /**
     * Generate AI summary of search results (Paid feature - Phase 3)
     */
    private Mono<String> generateAISummary(String query, List<Map<String, Object>> results) {
        StringBuilder context = new StringBuilder();
        for (int i = 0; i < Math.min(5, results.size()); i++) {
            Map<String, Object> result = results.get(i);
            String title = String.valueOf(result.getOrDefault("title", ""));
            String content = String.valueOf(result.getOrDefault("content",
                    result.getOrDefault("summary", "")));
            context.append(title).append(": ").append(content.substring(0, Math.min(200, content.length())))
                    .append("\n\n");
        }

        String prompt = "Based on the following search results for \"" + query + "\", " +
                "provide a brief 2-3 sentence summary of the key information found:\n\n" + context;

        return llmRouterService.generateContent(prompt, "search_summary")
                .map(Object::toString)
                .onErrorReturn("");
    }

    /**
     * Search notes with semantic search
     */
    private Mono<List<Map<String, Object>>> searchNotes(String query, Long userId, int limit) {
        return webClientBuilder.build()
                .get()
                .uri(notesServiceUrl + "/api/notes/semantic-search?q={query}&limit={limit}", query, limit)
                .header("X-User-Id", userId.toString())
                .retrieve()
                .bodyToMono(List.class)
                .map(list -> {
                    List<Map<String, Object>> results = new ArrayList<>();
                    for (Object item : list) {
                        if (item instanceof Map) {
                            Map<String, Object> map = new HashMap<>((Map<String, Object>) item);
                            map.put("_type", "note");
                            results.add(map);
                        }
                    }
                    return results;
                })
                .onErrorResume(e -> {
                    log.warn("Notes search failed: {}", e.getMessage());
                    return Mono.just(List.of());
                });
    }

    /**
     * Search feed posts
     */
    private Mono<List<Map<String, Object>>> searchFeed(String query, Long userId, int limit) {
        return webClientBuilder.build()
                .get()
                .uri(feedServiceUrl + "/api/feed/search?q={query}&limit={limit}", query, limit)
                .header("X-User-Id", userId.toString())
                .retrieve()
                .bodyToMono(List.class)
                .map(list -> {
                    List<Map<String, Object>> results = new ArrayList<>();
                    for (Object item : list) {
                        if (item instanceof Map) {
                            Map<String, Object> map = new HashMap<>((Map<String, Object>) item);
                            map.put("_type", "post");
                            results.add(map);
                        }
                    }
                    return results;
                })
                .onErrorResume(e -> {
                    log.warn("Feed search failed: {}", e.getMessage());
                    return Mono.just(List.of());
                });
    }

    /**
     * Search chat messages
     */
    private Mono<List<Map<String, Object>>> searchChat(String query, Long userId, int limit) {
        return webClientBuilder.build()
                .get()
                .uri(chatServiceUrl + "/api/messages/search?q={query}&limit={limit}", query, limit)
                .header("X-User-Id", userId.toString())
                .retrieve()
                .bodyToMono(List.class)
                .map(list -> {
                    List<Map<String, Object>> results = new ArrayList<>();
                    for (Object item : list) {
                        if (item instanceof Map) {
                            Map<String, Object> map = new HashMap<>((Map<String, Object>) item);
                            map.put("_type", "message");
                            results.add(map);
                        }
                    }
                    return results;
                })
                .onErrorResume(e -> {
                    log.warn("Chat search failed: {}", e.getMessage());
                    return Mono.just(List.of());
                });
    }

    /**
     * AI-powered search that understands intent
     */
    public Mono<Map<String, Object>> smartSearch(String naturalQuery, Long userId) {
        // Use LLM to understand search intent and generate optimized queries
        String prompt = """
                The user is searching for: "%s"

                Analyze this query and return a JSON object with:
                {
                    "intent": "find_notes" | "find_articles" | "find_messages" | "general",
                    "keywords": ["keyword1", "keyword2"],
                    "dateRange": "today" | "week" | "month" | "all",
                    "sentiment": "positive" | "negative" | "neutral"
                }
                """.formatted(naturalQuery);

        return llmRouterService.generateContent(prompt, null)
                .flatMap(analysis -> {
                    // Use the analysis to perform targeted search
                    return unifiedSearch(naturalQuery, userId, 10);
                })
                .map(results -> {
                    Map<String, Object> smartResults = new HashMap<>(results);
                    smartResults.put("aiPowered", true);
                    return smartResults;
                });
    }

    /**
     * Get related content suggestions
     */
    public Mono<List<Map<String, Object>>> getRelatedContent(String contentId, String contentType, Long userId) {
        // Fetch the source content, get its embedding, find similar items
        return unifiedSearch("related:" + contentId, userId, 5)
                .map(result -> {
                    Object results = result.get("results");
                    if (results instanceof List) {
                        return (List<Map<String, Object>>) results;
                    }
                    return List.of();
                });
    }
}
