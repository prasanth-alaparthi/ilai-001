package com.muse.auth.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.auth.ai.repository.AIJobRepository;
import com.muse.auth.ai.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;
    private final AIJobRepository jobRepo;
    private final ObjectMapper mapper;

    public AIController(AIService aiService, AIJobRepository jobRepo, ObjectMapper mapper) {
        this.aiService = aiService;
        this.jobRepo = jobRepo;
        this.mapper = mapper;
    }

    /**
     * Enqueue summarization for a source (journal/note).
     * Example: POST /api/ai/summary?source=journals&id=123
     */
    @PostMapping("/summary")
    public ResponseEntity<?> enqueueSummary(@RequestParam String source, @RequestParam Long id) {
        Map<String, Object> payload = Map.of("note", "summary-request");
        var resp = aiService.enqueueJob("summary", source, id, payload);
        return ResponseEntity.ok(resp);
    }

    /**
     * Enqueue embedding generation for a source.
     */
    @PostMapping("/embeddings")
    public ResponseEntity<?> enqueueEmbeddings(@RequestParam String source, @RequestParam Long id) {
        Map<String,Object> payload = Map.of("request", "embedding");
        var resp = aiService.enqueueJob("embedding", source, id, payload);
        return ResponseEntity.ok(resp);
    }

    /**
     * Search semantically — returns nearest matches (if embeddings exist).
     * Example: GET /api/search/semantic?q=kinematics&source=journals&topK=5
     */
    @GetMapping("/search")
    public ResponseEntity<?> semanticSearch(@RequestParam String q,
                                            @RequestParam(defaultValue = "journals") String source,
                                            @RequestParam(defaultValue = "5") int topK) {
        try {
            // If AI provider is enabled, compute query embedding on the fly via OpenAIIntegrationService
            // For simplicity, we will not compute embedding here; clients should call /api/ai/embeddings for items,
            // and we will run a SQL similarity query comparing stored embeddings -> we will implement two approaches:
            //  1) If DB supports pgvector, run native SQL to compute nearest neighbors using '<->' operator.
            //  2) Otherwise, fallback to text LIKE search via journals search API.

            // Here we choose to route to fallback: client can call /journals?q=term for now.
            return ResponseEntity.status(501).body(Map.of("message", "Semantic search must be executed server-side with provider enabled and vector index configured. See docs."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
