package com.muse.ai.controller;

import com.muse.ai.agent.ReActAgent;
import com.muse.ai.service.WebScrapingService;
import com.muse.ai.service.WebScrapingService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Scrape Controller - Web scraping and text selection automation endpoints
 */
@RestController
@RequestMapping("/api/scrape")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ScrapeController {

    private final WebScrapingService webScrapingService;
    private final ReActAgent reActAgent;

    /**
     * Scrape a single URL
     * GET /api/scrape?url=https://example.com
     */
    @GetMapping
    public Mono<ResponseEntity<ScrapedContent>> scrapeUrl(@RequestParam String url) {
        log.info("Scrape request for URL: {}", url);
        return webScrapingService.scrape(url)
                .map(ResponseEntity::ok);
    }

    /**
     * Search and scrape - combines search with scraping
     * GET /api/scrape/search?q=machine+learning&limit=5
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<SearchScrapedResult>> searchAndScrape(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int limit) {
        log.info("Search and scrape: query='{}', limit={}", q, limit);
        return webScrapingService.searchAndScrape(q, limit)
                .map(ResponseEntity::ok);
    }

    /**
     * Scrape multiple URLs
     * POST /api/scrape/batch
     */
    @PostMapping("/batch")
    public Mono<ResponseEntity<List<ScrapedContent>>> scrapeBatch(
            @RequestBody List<String> urls) {
        log.info("Batch scrape for {} URLs", urls.size());
        return webScrapingService.scrapeMultiple(urls)
                .map(ResponseEntity::ok);
    }

    /**
     * Save scraped content to notes
     * POST /api/scrape/save-to-notes
     */
    @PostMapping("/save-to-notes")
    public Mono<ResponseEntity<Map<String, Object>>> saveToNotes(
            @RequestBody SaveToNotesRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = extractUserId(jwt);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401)
                    .body(Map.of("error", "Authentication required")));
        }

        log.info("Saving scraped content to notes for user {}", userId);

        // Use ReAct agent to create the note
        String goal = String.format(
                "Create a new note titled '%s' in notebook ID %d with this content: %s",
                request.title,
                request.notebookId,
                truncate(request.content, 1000));

        return reActAgent.run(goal, userId)
                .map(result -> {
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("success", "completed".equals(result.getStatus()));
                    response.put("message", result.getAnswer() != null ? result.getAnswer() : "Note created");
                    response.put("steps", result.getTotalSteps());
                    response.put("durationMs", result.getDurationMs());
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body(Map.of("error", e.getMessage()))));
    }

    /**
     * Execute a ReAct agent for text selection automation
     * POST /api/scrape/agent
     */
    @PostMapping("/agent")
    public Mono<ResponseEntity<ReActAgent.AgentResult>> executeAgent(
            @RequestBody AgentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = extractUserId(jwt);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).build());
        }

        log.info("Agent request from user {}: {}", userId, request.goal);

        return reActAgent.run(request.goal, userId)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> {
                    log.error("Agent execution failed: {}", e.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    // ============== Helper Methods ==============

    private Long extractUserId(Jwt jwt) {
        if (jwt == null)
            return null;
        Object userId = jwt.getClaim("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    private String truncate(String s, int maxLen) {
        if (s == null || s.length() <= maxLen)
            return s;
        return s.substring(0, maxLen) + "...";
    }

    // ============== Request DTOs ==============

    public record SaveToNotesRequest(
            String title,
            String content,
            Long notebookId,
            Long sectionId,
            List<String> imageUrls,
            List<String> videoUrls,
            String sourceUrl) {
    }

    public record AgentRequest(
            String goal,
            Map<String, Object> context) {
    }
}
