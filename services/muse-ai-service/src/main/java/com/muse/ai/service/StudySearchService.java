package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.ai.entity.EducationalSource;
import com.muse.ai.entity.SubjectCategory;
import com.muse.ai.repository.EducationalSourceRepository;
import com.muse.ai.repository.SubjectCategoryRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Study Search Service - Unified search across dynamic educational sources
 * Sources are loaded from database and parsed using configurable JSON path
 * mappings
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StudySearchService {

    private final EducationalSourceRepository sourceRepository;
    private final SubjectCategoryRepository categoryRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final UnifiedSearchService unifiedSearchService; // For local notes search

    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    // ============== Public API ==============

    /**
     * Unified search across local content and web sources
     */
    public Mono<StudySearchResponse> search(StudySearchRequest request) {
        log.info("Study search: query='{}', sources={}, subjects={}, includeLocal={}",
                request.query(), request.sourceCodes(), request.subjects(), request.includeLocal());

        // Get enabled sources based on request filters
        List<EducationalSource> sources = getFilteredSources(request);

        // Search all sources in parallel
        Flux<SearchResultItem> webResults = Flux.fromIterable(sources)
                .flatMap(source -> searchSource(source, request.query(), request.limit())
                        .flatMapMany(Flux::fromIterable))
                .onErrorContinue((e, o) -> log.warn("Source search failed: {}", e.getMessage()));

        // Optionally search local notes
        Flux<SearchResultItem> localResults = request.includeLocal()
                ? searchLocal(request.query(), request.userId(), request.limit())
                : Flux.empty();

        // Combine and return
        return Flux.merge(localResults, webResults)
                .collectList()
                .map(results -> {
                    // Sort by relevance score
                    results.sort((a, b) -> Double.compare(b.score(), a.score()));

                    return new StudySearchResponse(
                            request.query(),
                            results.stream().limit(request.limit()).toList(),
                            results.size(),
                            getEnabledSources(),
                            getEnabledCategories());
                });
    }

    /**
     * Get all enabled sources for filter UI
     */
    public List<SourceInfo> getEnabledSources() {
        return sourceRepository.findByEnabledTrueOrderByDisplayOrder().stream()
                .map(s -> new SourceInfo(s.getCode(), s.getName(), s.getCategory(),
                        s.getIconEmoji(), s.getColor(), s.getIsPremium()))
                .toList();
    }

    /**
     * Get all enabled subject categories for filter UI
     */
    public List<CategoryInfo> getEnabledCategories() {
        return categoryRepository.findByEnabledTrueOrderByDisplayOrder().stream()
                .map(c -> new CategoryInfo(c.getCode(), c.getName(), c.getIconEmoji(), c.getColor()))
                .toList();
    }

    // ============== Source Filtering ==============

    private List<EducationalSource> getFilteredSources(StudySearchRequest request) {
        List<EducationalSource> sources;

        if (request.sourceCodes() != null && !request.sourceCodes().isEmpty()) {
            // Filter by specific source codes
            sources = sourceRepository.findByEnabledTrueOrderByDisplayOrder().stream()
                    .filter(s -> request.sourceCodes().contains(s.getCode()))
                    .toList();
        } else if (request.subjects() != null && !request.subjects().isEmpty()) {
            // Filter by subjects
            sources = request.subjects().stream()
                    .flatMap(subject -> sourceRepository.findBySubject(subject).stream())
                    .distinct()
                    .toList();
        } else {
            sources = sourceRepository.findByEnabledTrueOrderByDisplayOrder();
        }

        // Filter premium sources for non-premium users
        if (!request.isPremiumUser()) {
            sources = sources.stream()
                    .filter(s -> !s.getIsPremium())
                    .toList();
        }

        return sources;
    }

    // ============== Dynamic Source Search ==============

    @CircuitBreaker(name = "studySearch", fallbackMethod = "searchSourceFallback")
    private Mono<List<SearchResultItem>> searchSource(EducationalSource source, String query, int limit) {
        String url = buildSearchUrl(source, query, limit);

        log.debug("Searching source '{}': {}", source.getCode(), url);

        WebClient.RequestHeadersSpec<?> request = webClientBuilder.build()
                .get()
                .uri(url);

        // Add API key header if configured
        if (source.getApiKeyHeader() != null && source.getApiKey() != null) {
            request = request.header(source.getApiKeyHeader(), source.getApiKey());
        }

        // Add custom headers if configured
        if (source.getRequestHeaders() != null) {
            try {
                JsonNode headers = objectMapper.readTree(source.getRequestHeaders());
                Iterator<String> fieldNames = headers.fieldNames();
                WebClient.RequestHeadersSpec<?> finalRequest = request;
                while (fieldNames.hasNext()) {
                    String name = fieldNames.next();
                    finalRequest = finalRequest.header(name, headers.get(name).asText());
                }
                request = finalRequest;
            } catch (Exception e) {
                log.warn("Failed to parse custom headers for {}: {}", source.getCode(), e.getMessage());
            }
        }

        return request
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(TIMEOUT)
                .map(response -> parseResponse(source, response))
                .onErrorResume(e -> {
                    log.warn("Search failed for '{}': {}", source.getCode(), e.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    private String buildSearchUrl(EducationalSource source, String query, int limit) {
        String url = source.getBaseUrl() + source.getSearchEndpoint();
        url = url.replace("{query}", encodeQuery(query));
        url = url.replace("{limit}", String.valueOf(limit));
        return url;
    }

    private String encodeQuery(String query) {
        try {
            return java.net.URLEncoder.encode(query, "UTF-8");
        } catch (Exception e) {
            return query.replace(" ", "+");
        }
    }

    // ============== Dynamic Response Parsing ==============

    private List<SearchResultItem> parseResponse(EducationalSource source, JsonNode response) {
        List<SearchResultItem> results = new ArrayList<>();

        try {
            // Get results array using configured path
            JsonNode resultsNode = extractPath(response, source.getResultsPath());

            if (resultsNode == null || !resultsNode.isArray()) {
                // Try direct array
                if (response.isArray()) {
                    resultsNode = response;
                } else {
                    return results;
                }
            }

            for (JsonNode item : resultsNode) {
                try {
                    String title = extractStringPath(item, source.getTitlePath());
                    String snippet = extractStringPath(item, source.getSnippetPath());
                    String url = extractStringPath(item, source.getUrlPath());
                    String authors = extractStringPath(item, source.getAuthorsPath());
                    String publishedDate = extractStringPath(item, source.getPublishedDatePath());
                    String thumbnail = extractStringPath(item, source.getThumbnailPath());

                    if (title != null && !title.isBlank()) {
                        results.add(new SearchResultItem(
                                UUID.randomUUID().toString(),
                                title,
                                snippet != null ? truncate(snippet, 300) : "",
                                url,
                                source.getCode(),
                                source.getName(),
                                source.getIconEmoji(),
                                "web",
                                0.8, // Default relevance score
                                authors,
                                publishedDate,
                                thumbnail));
                    }
                } catch (Exception e) {
                    log.debug("Failed to parse item from {}: {}", source.getCode(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse response from {}: {}", source.getCode(), e.getMessage());
        }

        return results;
    }

    private JsonNode extractPath(JsonNode root, String jsonPath) {
        if (jsonPath == null || jsonPath.isBlank()) {
            return root;
        }

        // Simple JSON path support ($.field.subfield or just field.subfield)
        String path = jsonPath.startsWith("$.") ? jsonPath.substring(2) : jsonPath;
        String[] parts = path.split("\\.");

        JsonNode current = root;
        for (String part : parts) {
            if (current == null)
                return null;

            // Handle array notation like [0] or [*]
            if (part.contains("[")) {
                String fieldName = part.substring(0, part.indexOf("["));
                if (!fieldName.isEmpty()) {
                    current = current.get(fieldName);
                }
                String indexStr = part.substring(part.indexOf("[") + 1, part.indexOf("]"));
                if (current != null && current.isArray() && !indexStr.equals("*")) {
                    int index = Integer.parseInt(indexStr);
                    current = current.get(index);
                }
            } else {
                current = current.get(part);
            }
        }

        return current;
    }

    private String extractStringPath(JsonNode root, String jsonPath) {
        JsonNode node = extractPath(root, jsonPath);
        if (node == null)
            return null;
        if (node.isTextual())
            return node.asText();
        if (node.isArray() && node.size() > 0) {
            // Join array elements
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(node.size(), 5); i++) {
                if (i > 0)
                    sb.append(", ");
                sb.append(node.get(i).asText());
            }
            return sb.toString();
        }
        return node.toString();
    }

    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength)
            return text;
        return text.substring(0, maxLength) + "...";
    }

    private Mono<List<SearchResultItem>> searchSourceFallback(EducationalSource source, String query, int limit,
            Throwable t) {
        log.warn("Circuit breaker triggered for {}: {}", source.getCode(), t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    // ============== Local Notes Search ==============

    private Flux<SearchResultItem> searchLocal(String query, Long userId, int limit) {
        return unifiedSearchService.unifiedSearch(query, userId, limit)
                .flatMapMany(results -> {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> items = (List<Map<String, Object>>) results.get("results");
                    if (items == null)
                        return Flux.empty();

                    return Flux.fromIterable(items.stream()
                            .map(item -> new SearchResultItem(
                                    String.valueOf(item.get("id")),
                                    (String) item.get("title"),
                                    (String) item.get("excerpt"),
                                    "/notes?id=" + item.get("id"),
                                    "local",
                                    "My Notes",
                                    "📝",
                                    (String) item.getOrDefault("type", "note"),
                                    item.get("score") != null ? ((Number) item.get("score")).doubleValue() : 0.9,
                                    null,
                                    null,
                                    null))
                            .toList());
                })
                .onErrorResume(e -> {
                    log.warn("Local search failed: {}", e.getMessage());
                    return Flux.empty();
                });
    }

    // ============== DTOs ==============

    public record StudySearchRequest(
            String query,
            List<String> sourceCodes, // Filter by specific sources
            List<String> subjects, // Filter by subjects
            boolean includeLocal, // Include local notes
            boolean isPremiumUser,
            Long userId,
            int limit) {
        public StudySearchRequest {
            if (limit <= 0)
                limit = 20;
            if (limit > 100)
                limit = 100;
        }
    }

    public record StudySearchResponse(
            String query,
            List<SearchResultItem> results,
            int totalResults,
            List<SourceInfo> availableSources,
            List<CategoryInfo> availableCategories) {
    }

    public record SearchResultItem(
            String id,
            String title,
            String snippet,
            String url,
            String sourceCode,
            String sourceName,
            String sourceIcon,
            String type, // "web", "note", "paper", "book"
            double score,
            String authors,
            String publishedDate,
            String thumbnail) {
    }

    public record SourceInfo(
            String code,
            String name,
            String category,
            String icon,
            String color,
            boolean isPremium) {
    }

    public record CategoryInfo(
            String code,
            String name,
            String icon,
            String color) {
    }
}
