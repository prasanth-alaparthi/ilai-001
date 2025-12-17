package com.muse.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.ai.entity.ResearchCache;
import com.muse.ai.repository.ResearchCacheRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Web Research Service - Phase 3
 * Aggregates content from Wikipedia, arXiv, DuckDuckGo, and news sources
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebResearchService {

    private final WebClient.Builder webClientBuilder;
    private final ResearchCacheRepository cacheRepository;
    private final ObjectMapper objectMapper;

    private static final Duration CACHE_TTL = Duration.ofHours(24);

    // ============== Wikipedia Integration ==============

    @CircuitBreaker(name = "default", fallbackMethod = "wikipediaFallback")
    public Mono<WikipediaResult> searchWikipedia(String query) {
        return getCachedOrFetch("wikipedia", query, () -> webClientBuilder.build()
                .get()
                .uri("https://en.wikipedia.org/api/rest_v1/page/summary/{title}",
                        query.replace(" ", "_"))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(this::parseWikipediaResponse)
                .onErrorResume(e -> searchWikipediaFallback(query)));
    }

    private Mono<WikipediaResult> searchWikipediaFallback(String query) {
        // Search Wikipedia for the query if direct page not found
        return webClientBuilder.build()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("en.wikipedia.org")
                        .path("/w/api.php")
                        .queryParam("action", "query")
                        .queryParam("list", "search")
                        .queryParam("srsearch", query)
                        .queryParam("format", "json")
                        .queryParam("srlimit", "3")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(response -> {
                    JsonNode results = response.path("query").path("search");
                    if (results.isArray() && results.size() > 0) {
                        String title = results.get(0).path("title").asText();
                        return searchWikipedia(title);
                    }
                    return Mono.just(new WikipediaResult("", "", "", ""));
                });
    }

    private WikipediaResult parseWikipediaResponse(JsonNode response) {
        return new WikipediaResult(
                response.path("title").asText(),
                response.path("extract").asText(),
                response.path("content_urls").path("desktop").path("page").asText(),
                response.path("thumbnail").path("source").asText(""));
    }

    private Mono<WikipediaResult> wikipediaFallback(String query, Throwable t) {
        log.warn("Wikipedia fallback for '{}': {}", query, t.getMessage());
        return Mono.just(new WikipediaResult("",
                "Wikipedia information temporarily unavailable", "", ""));
    }

    // ============== DuckDuckGo Search ==============

    @CircuitBreaker(name = "default", fallbackMethod = "duckduckgoFallback")
    public Mono<List<SearchResult>> searchDuckDuckGo(String query) {
        return getCachedOrFetch("duckduckgo", query, () -> webClientBuilder.build()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("api.duckduckgo.com")
                        .path("/")
                        .queryParam("q", query)
                        .queryParam("format", "json")
                        .queryParam("no_html", "1")
                        .queryParam("skip_disambig", "1")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(this::parseDuckDuckGoResponse));
    }

    private List<SearchResult> parseDuckDuckGoResponse(JsonNode response) {
        List<SearchResult> results = new ArrayList<>();

        // Abstract (main result)
        String abstractText = response.path("AbstractText").asText("");
        if (!abstractText.isEmpty()) {
            results.add(new SearchResult(
                    response.path("Heading").asText("Result"),
                    abstractText,
                    response.path("AbstractURL").asText(""),
                    "duckduckgo"));
        }

        // Related topics
        JsonNode topics = response.path("RelatedTopics");
        if (topics.isArray()) {
            for (int i = 0; i < Math.min(topics.size(), 5); i++) {
                JsonNode topic = topics.get(i);
                if (topic.has("Text")) {
                    results.add(new SearchResult(
                            topic.path("Text").asText().split(" - ")[0],
                            topic.path("Text").asText(),
                            topic.path("FirstURL").asText(""),
                            "duckduckgo"));
                }
            }
        }

        return results;
    }

    private Mono<List<SearchResult>> duckduckgoFallback(String query, Throwable t) {
        log.warn("DuckDuckGo fallback for '{}': {}", query, t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    // ============== arXiv Academic Papers ==============

    @CircuitBreaker(name = "default", fallbackMethod = "arxivFallback")
    public Mono<List<ArxivPaper>> searchArxiv(String query) {
        return getCachedOrFetch("arxiv", query, () -> webClientBuilder.build()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("export.arxiv.org")
                        .path("/api/query")
                        .queryParam("search_query", "all:" + query)
                        .queryParam("start", "0")
                        .queryParam("max_results", "5")
                        .queryParam("sortBy", "relevance")
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parseArxivResponse));
    }

    private List<ArxivPaper> parseArxivResponse(String xml) {
        List<ArxivPaper> papers = new ArrayList<>();

        // Simple XML parsing (for production, use proper XML parser)
        String[] entries = xml.split("<entry>");
        for (int i = 1; i < Math.min(entries.length, 6); i++) {
            String entry = entries[i];
            papers.add(new ArxivPaper(
                    extractXmlValue(entry, "title").replaceAll("\\s+", " ").trim(),
                    extractXmlValue(entry, "summary").replaceAll("\\s+", " ").trim(),
                    extractXmlValue(entry, "id"),
                    extractAuthors(entry),
                    extractXmlValue(entry, "published").substring(0, 10)));
        }

        return papers;
    }

    private String extractXmlValue(String xml, String tag) {
        int start = xml.indexOf("<" + tag + ">") + tag.length() + 2;
        int end = xml.indexOf("</" + tag + ">");
        if (start > tag.length() + 1 && end > start) {
            return xml.substring(start, end);
        }
        // Try with namespace
        start = xml.indexOf("<" + tag);
        if (start >= 0) {
            start = xml.indexOf(">", start) + 1;
            end = xml.indexOf("</" + tag, start);
            if (end > start) {
                return xml.substring(start, end);
            }
        }
        return "";
    }

    private List<String> extractAuthors(String entry) {
        List<String> authors = new ArrayList<>();
        String[] parts = entry.split("<author>");
        for (int i = 1; i < Math.min(parts.length, 4); i++) {
            String name = extractXmlValue(parts[i], "name");
            if (!name.isEmpty()) {
                authors.add(name);
            }
        }
        return authors;
    }

    private Mono<List<ArxivPaper>> arxivFallback(String query, Throwable t) {
        log.warn("arXiv fallback for '{}': {}", query, t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    // ============== Combined Research ==============

    /**
     * Search all sources in parallel and combine results
     */
    public Mono<CombinedResearchResult> researchTopic(String query) {
        return Flux.merge(
                searchWikipedia(query).map(w -> (Object) w),
                searchDuckDuckGo(query).map(d -> (Object) d),
                searchArxiv(query).map(a -> (Object) a))
                .collectList()
                .map(results -> {
                    WikipediaResult wiki = null;
                    List<SearchResult> webResults = new ArrayList<>();
                    List<ArxivPaper> papers = new ArrayList<>();

                    for (Object result : results) {
                        if (result instanceof WikipediaResult w) {
                            wiki = w;
                        } else if (result instanceof List<?> list) {
                            if (!list.isEmpty()) {
                                if (list.get(0) instanceof SearchResult) {
                                    webResults.addAll((List<SearchResult>) list);
                                } else if (list.get(0) instanceof ArxivPaper) {
                                    papers.addAll((List<ArxivPaper>) list);
                                }
                            }
                        }
                    }

                    return new CombinedResearchResult(query, wiki, webResults, papers);
                });
    }

    // ============== Caching ==============

    @SuppressWarnings("unchecked")
    private <T> Mono<T> getCachedOrFetch(String sourceType, String query,
            java.util.function.Supplier<Mono<T>> fetcher) {
        String queryHash = hashQuery(query);

        return Mono.fromCallable(() -> cacheRepository.findValidCache(queryHash, sourceType, LocalDateTime.now()))
                .flatMap(optionalCache -> {
                    if (optionalCache.isPresent()) {
                        try {
                            log.debug("Cache hit for {} query: {}", sourceType, query);
                            T cached = (T) objectMapper.readValue(
                                    optionalCache.get().getResults(), Object.class);
                            return Mono.just(cached);
                        } catch (JsonProcessingException e) {
                            log.warn("Cache parse error, fetching fresh");
                        }
                    }

                    return fetcher.get()
                            .doOnSuccess(result -> cacheResult(queryHash, query, sourceType, result));
                });
    }

    private void cacheResult(String queryHash, String query, String sourceType, Object result) {
        try {
            ResearchCache cache = ResearchCache.builder()
                    .queryHash(queryHash)
                    .query(query)
                    .sourceType(sourceType)
                    .results(objectMapper.writeValueAsString(result))
                    .expiresAt(LocalDateTime.now().plus(CACHE_TTL))
                    .build();
            cacheRepository.save(cache);
            log.debug("Cached {} result for query: {}", sourceType, query);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache result: {}", e.getMessage());
        }
    }

    private String hashQuery(String query) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(query.toLowerCase().trim().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash).substring(0, 64);
        } catch (Exception e) {
            return query.hashCode() + "";
        }
    }

    // ============== Result Records ==============

    public record WikipediaResult(String title, String summary, String url, String thumbnail) {
    }

    public record SearchResult(String title, String snippet, String url, String source) {
    }

    public record ArxivPaper(String title, String summary, String arxivId,
            List<String> authors, String publishedDate) {
    }

    public record CombinedResearchResult(
            String query,
            WikipediaResult wikipedia,
            List<SearchResult> webResults,
            List<ArxivPaper> academicPapers) {
    }
}
