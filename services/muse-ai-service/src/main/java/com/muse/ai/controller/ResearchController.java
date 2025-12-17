package com.muse.ai.controller;

import com.muse.ai.service.DeepResearchService;
import com.muse.ai.service.DeepResearchService.*;
import com.muse.ai.service.EmbeddingService;
import com.muse.ai.service.EmbeddingService.SemanticSearchResult;
import com.muse.ai.service.WebResearchService;
import com.muse.ai.service.WebResearchService.CombinedResearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Research Controller - Phase 3 API
 * Exposes deep research, semantic search, and web aggregation endpoints
 */
@RestController
@RequestMapping("/api/research")
@RequiredArgsConstructor
@Slf4j
public class ResearchController {

        private final DeepResearchService deepResearchService;
        private final EmbeddingService embeddingService;
        private final WebResearchService webResearchService;

        // ============== Deep Research ==============

        /**
         * Perform deep research on a topic
         * POST /api/research
         */
        @PostMapping
        public Mono<ResponseEntity<DeepResearchResult>> research(
                        @RequestHeader(value = "X-User-Id", required = false) Long userId,
                        @RequestBody ResearchRequest request) {
                log.info("Deep research request from user {}: {}", userId, request.query());

                ResearchOptions options = switch (request.depth()) {
                        case "quick" -> ResearchOptions.quick();
                        case "academic" -> ResearchOptions.academic();
                        default -> ResearchOptions.deep();
                };

                return deepResearchService.research(request.query(), userId != null ? userId : 1L, options)
                                .map(ResponseEntity::ok);
        }

        /**
         * Deep research endpoint - alias for frontend compatibility
         * POST /api/research/deep
         */
        @PostMapping("/deep")
        public Mono<ResponseEntity<DeepResearchResult>> deepResearch(
                        @RequestHeader(value = "X-User-Id", required = false) Long userId,
                        @RequestBody ResearchRequest request) {
                return research(userId, request);
        }

        /**
         * Quick research - lightweight version
         * GET /api/research/quick?q=query
         */
        @GetMapping("/quick")
        public Mono<ResponseEntity<DeepResearchResult>> quickResearch(
                        @RequestHeader("X-User-Id") Long userId,
                        @RequestParam("q") String query) {
                return deepResearchService.quickResearch(query, userId)
                                .map(ResponseEntity::ok);
        }

        /**
         * Academic research - scholarly focus
         * GET /api/research/academic?q=query
         */
        @GetMapping("/academic")
        public Mono<ResponseEntity<DeepResearchResult>> academicResearch(
                        @RequestHeader("X-User-Id") Long userId,
                        @RequestParam("q") String query) {
                return deepResearchService.academicResearch(query, userId)
                                .map(ResponseEntity::ok);
        }

        // ============== Semantic Search ==============

        /**
         * Search user's notes using semantic similarity
         * GET /api/research/notes/search?q=query&limit=10
         */
        @GetMapping("/notes/search")
        public Mono<ResponseEntity<List<SemanticSearchResult>>> semanticSearch(
                        @RequestHeader("X-User-Id") Long userId,
                        @RequestParam("q") String query,
                        @RequestParam(value = "limit", defaultValue = "10") int limit,
                        @RequestParam(value = "threshold", defaultValue = "0.5") double threshold) {

                return embeddingService.searchSimilarWithThreshold(query, userId, threshold, limit)
                                .map(ResponseEntity::ok);
        }

        /**
         * Index a note for semantic search
         * POST /api/research/notes/{noteId}/index
         */
        @PostMapping("/notes/{noteId}/index")
        public Mono<ResponseEntity<Map<String, Object>>> indexNote(
                        @RequestHeader("X-User-Id") Long userId,
                        @PathVariable Long noteId,
                        @RequestBody IndexRequest request) {

                return embeddingService.indexNote(noteId, userId, request.content())
                                .map(embeddings -> ResponseEntity.ok(Map.of(
                                                "noteId", noteId,
                                                "chunks", embeddings.size(),
                                                "indexed", true)));
        }

        /**
         * Check if note is indexed
         * GET /api/research/notes/{noteId}/indexed
         */
        @GetMapping("/notes/{noteId}/indexed")
        public ResponseEntity<Map<String, Object>> isNoteIndexed(@PathVariable Long noteId) {
                boolean indexed = embeddingService.isNoteIndexed(noteId);
                return ResponseEntity.ok(Map.of(
                                "noteId", noteId,
                                "indexed", indexed));
        }

        /**
         * Get embedding statistics for user
         * GET /api/research/stats
         */
        @GetMapping("/stats")
        public ResponseEntity<Map<String, Object>> getStats(
                        @RequestHeader("X-User-Id") Long userId) {
                return ResponseEntity.ok(Map.of(
                                "userId", userId,
                                "embeddingCount", embeddingService.getEmbeddingCount(userId)));
        }

        // ============== Web Research ==============

        /**
         * Search external sources (Wikipedia, DuckDuckGo, arXiv)
         * GET /api/research/web?q=query
         */
        @GetMapping("/web")
        public Mono<ResponseEntity<CombinedResearchResult>> webResearch(
                        @RequestParam("q") String query) {
                return webResearchService.researchTopic(query)
                                .map(ResponseEntity::ok);
        }

        /**
         * Search Wikipedia only
         * GET /api/research/wikipedia?q=query
         */
        @GetMapping("/wikipedia")
        public Mono<ResponseEntity<WebResearchService.WikipediaResult>> searchWikipedia(
                        @RequestParam("q") String query) {
                return webResearchService.searchWikipedia(query)
                                .map(ResponseEntity::ok);
        }

        /**
         * Search arXiv only
         * GET /api/research/arxiv?q=query
         */
        @GetMapping("/arxiv")
        public Mono<ResponseEntity<List<WebResearchService.ArxivPaper>>> searchArxiv(
                        @RequestParam("q") String query) {
                return webResearchService.searchArxiv(query)
                                .map(ResponseEntity::ok);
        }

        // ============== Request/Response Records ==============

        public record ResearchRequest(String query, String depth) {
                public ResearchRequest {
                        if (depth == null)
                                depth = "deep";
                }
        }

        public record IndexRequest(String content) {
        }
}
