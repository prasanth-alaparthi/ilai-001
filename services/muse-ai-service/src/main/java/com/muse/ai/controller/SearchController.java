package com.muse.ai.controller;

import com.muse.ai.service.UnifiedSearchService;
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
 * Unified Search Controller
 * Provides cross-module search across all content types
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

        private final UnifiedSearchService searchService;

        /**
         * Unified search across all modules
         * Searches notes, feed, chat, and journal in parallel
         */
        @GetMapping("/unified")
        public Mono<ResponseEntity<Map<String, Object>>> unifiedSearch(
                        @RequestParam String q,
                        @RequestParam(defaultValue = "10") int limit,
                        @AuthenticationPrincipal Jwt jwt) {

                Long userId = extractUserId(jwt);

                return searchService.unifiedSearch(q, userId, limit)
                                .map(ResponseEntity::ok)
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * AI-powered smart search
         * Understands natural language queries and searches intelligently
         */
        @GetMapping("/smart")
        public Mono<ResponseEntity<Map<String, Object>>> smartSearch(
                        @RequestParam String q,
                        @AuthenticationPrincipal Jwt jwt) {

                Long userId = extractUserId(jwt);

                return searchService.smartSearch(q, userId)
                                .map(ResponseEntity::ok)
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Get related content suggestions
         */
        @GetMapping("/related")
        public Mono<ResponseEntity<List<Map<String, Object>>>> getRelatedContent(
                        @RequestParam String contentId,
                        @RequestParam String contentType,
                        @AuthenticationPrincipal Jwt jwt) {

                Long userId = extractUserId(jwt);

                return searchService.getRelatedContent(contentId, contentType, userId)
                                .map(ResponseEntity::ok)
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(List.of())));
        }

        /**
         * Search by content type
         */
        @GetMapping("/{type}")
        public Mono<ResponseEntity<Map<String, Object>>> searchByType(
                        @PathVariable String type,
                        @RequestParam String q,
                        @RequestParam(defaultValue = "10") int limit,
                        @AuthenticationPrincipal Jwt jwt) {

                Long userId = extractUserId(jwt);

                // Route to specific search based on type
                return searchService.unifiedSearch(q, userId, limit)
                                .map(results -> {
                                        // Filter results by type
                                        if (results.get("results") instanceof List<?> allResults) {
                                                List<?> filtered = allResults.stream()
                                                                .filter(r -> r instanceof Map<?, ?> m
                                                                                && type.equals(m.get("_source")))
                                                                .toList();
                                                return ResponseEntity.ok(Map.of(
                                                                "query", q,
                                                                "type", type,
                                                                "results", filtered,
                                                                "totalResults", filtered.size()));
                                        }
                                        return ResponseEntity.ok(results);
                                })
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Extract userId from JWT, checking claim first then falling back to subject
         */
        private Long extractUserId(Jwt jwt) {
                if (jwt == null) {
                        log.warn("JWT is null, using default userId");
                        return 1L;
                }
                // Check for userId claim first (added by auth service)
                Object userId = jwt.getClaim("userId");
                if (userId instanceof Number) {
                        return ((Number) userId).longValue();
                }
                // Fallback to subject (may be numeric ID or email)
                try {
                        return Long.parseLong(jwt.getSubject());
                } catch (NumberFormatException e) {
                        log.warn("Could not parse userId from subject '{}', using default", jwt.getSubject());
                        return 1L;
                }
        }
}
