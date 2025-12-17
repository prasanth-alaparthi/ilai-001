package com.muse.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Free Search Service - Unified search for FREE mode
 * Uses BM25 keyword search + PostgreSQL full-text search
 * No AI/embedding costs!
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FreeSearchService {

    private final BM25SearchService bm25Service;
    private final WebClient.Builder webClientBuilder;

    @Value("${services.notes.url:http://localhost:8082}")
    private String notesServiceUrl;

    @Value("${services.feed.url:http://localhost:8083}")
    private String feedServiceUrl;

    /**
     * Unified free search across notes, feed, and more
     */
    public FreeSearchResults search(String query, Long userId, SearchOptions options) {
        log.info("Free search for '{}' by user {}", query, userId);

        List<SearchResultItem> allResults = new ArrayList<>();

        // Search notes (BM25 + PostgreSQL FTS)
        if (options.searchNotes()) {
            List<SearchResultItem> noteResults = searchNotes(query, userId, options.limit());
            allResults.addAll(noteResults);
        }

        // Search feed articles
        if (options.searchFeed()) {
            List<SearchResultItem> feedResults = searchFeed(query, userId, options.limit());
            allResults.addAll(feedResults);
        }

        // Combine and rank results
        List<SearchResultItem> ranked = rankResults(allResults, query);

        // Apply limit
        int limit = options.limit() > 0 ? options.limit() : 20;
        ranked = ranked.stream().limit(limit).toList();

        return FreeSearchResults.builder()
                .query(query)
                .results(ranked)
                .totalCount(ranked.size())
                .mode("free")
                .build();
    }

    /**
     * Search notes using PostgreSQL full-text search
     */
    private List<SearchResultItem> searchNotes(String query, Long userId, int limit) {
        try {
            // Call notes service full-text search endpoint
            Map<String, Object>[] notes = webClientBuilder.build()
                    .get()
                    .uri(notesServiceUrl + "/api/notes/search?q={query}&limit={limit}", query, limit)
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .bodyToMono(Map[].class)
                    .block();

            if (notes == null)
                return List.of();

            return Arrays.stream(notes)
                    .map(note -> SearchResultItem.builder()
                            .id(note.get("id").toString())
                            .type("note")
                            .title((String) note.get("title"))
                            .snippet(extractSnippet(note.get("content"), query))
                            .score(1.0) // Will be re-ranked
                            .metadata(Map.of(
                                    "sectionId", note.getOrDefault("sectionId", ""),
                                    "notebookId", note.getOrDefault("notebookId", "")))
                            .build())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Failed to search notes: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Search feed articles
     */
    private List<SearchResultItem> searchFeed(String query, Long userId, int limit) {
        try {
            Map<String, Object>[] articles = webClientBuilder.build()
                    .get()
                    .uri(feedServiceUrl + "/api/feed/search?q={query}&limit={limit}", query, limit)
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .bodyToMono(Map[].class)
                    .block();

            if (articles == null)
                return List.of();

            return Arrays.stream(articles)
                    .map(article -> SearchResultItem.builder()
                            .id(article.get("id").toString())
                            .type("article")
                            .title((String) article.get("title"))
                            .snippet((String) article.getOrDefault("summary", ""))
                            .score(0.8) // Slightly lower than notes
                            .metadata(Map.of(
                                    "source", article.getOrDefault("source", ""),
                                    "url", article.getOrDefault("url", "")))
                            .build())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Failed to search feed: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Rank results using BM25-like scoring
     */
    private List<SearchResultItem> rankResults(List<SearchResultItem> results, String query) {
        // Convert to BM25 documents
        List<BM25SearchService.Document> docs = results.stream()
                .map(r -> new BM25SearchService.Document(
                        r.getId(),
                        r.getTitle(),
                        r.getTitle() + " " + r.getSnippet()))
                .toList();

        // Get BM25 scores
        List<BM25SearchService.SearchResult> bm25Results = bm25Service.search(query, docs);

        // Map scores back to results
        Map<String, Double> scores = bm25Results.stream()
                .collect(Collectors.toMap(
                        BM25SearchService.SearchResult::getId,
                        BM25SearchService.SearchResult::getScore));

        // Update and sort
        return results.stream()
                .peek(r -> r.setScore(scores.getOrDefault(r.getId(), 0.0) * r.getScore()))
                .sorted(Comparator.comparing(SearchResultItem::getScore).reversed())
                .collect(Collectors.toList());
    }

    private String extractSnippet(Object content, String query) {
        if (content == null)
            return "";
        String text = content.toString();
        if (text.length() <= 200)
            return text;

        String queryLower = query.toLowerCase();
        int idx = text.toLowerCase().indexOf(queryLower);
        if (idx >= 0) {
            int start = Math.max(0, idx - 50);
            int end = Math.min(text.length(), idx + 150);
            return (start > 0 ? "..." : "") + text.substring(start, end) + "...";
        }
        return text.substring(0, 200) + "...";
    }

    // ============== Data Classes ==============

    public record SearchOptions(boolean searchNotes, boolean searchFeed, int limit) {
        public static SearchOptions defaults() {
            return new SearchOptions(true, true, 20);
        }
    }

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    public static class FreeSearchResults {
        private String query;
        private List<SearchResultItem> results;
        private int totalCount;
        private String mode;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class SearchResultItem {
        private String id;
        private String type;
        private String title;
        private String snippet;
        private double score;
        private Map<String, Object> metadata;
    }
}
