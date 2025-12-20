package com.muse.ai.controller;

import com.muse.ai.service.GroqLLMClient;
import com.muse.ai.service.LLMRouterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Health Check Controller for AI Service
 * Provides test endpoints for verifying AI integrations
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final GroqLLMClient groqClient;
    private final LLMRouterService llmRouter;

    /**
     * Simple health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "muse-ai-service",
                "groq_configured", groqClient.isConfigured(),
                "timestamp", System.currentTimeMillis()));
    }

    /**
     * Test Groq connection - sends a simple request to verify Groq API is working
     * GET /api/ai/test-groq
     */
    @GetMapping("/test-groq")
    public Mono<ResponseEntity<Map<String, Object>>> testGroq() {
        if (!groqClient.isConfigured()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Groq API key is not configured. Set GROQ_API_KEY environment variable.")));
        }

        return groqClient.generateContent(
                "Say 'Hello from ILAI!' and nothing else.",
                "You are a test bot. Only respond with exactly what is asked.")
                .map(response -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "provider", "groq",
                        "model", "llama-3.3-70b-versatile",
                        "response", response,
                        "timestamp", System.currentTimeMillis())))
                .onErrorResume(error -> Mono.just(ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "provider", "groq"))));
    }

    /**
     * Test LLM Router (tries Groq first, falls back to Gemini)
     * GET /api/ai/test-llm
     */
    @GetMapping("/test-llm")
    public Mono<ResponseEntity<Map<String, Object>>> testLLM() {
        return llmRouter.generateContent("Say 'ILAI AI is working!' and nothing else.", "assistant")
                .map(response -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "response", response,
                        "timestamp", System.currentTimeMillis())))
                .onErrorResume(error -> Mono.just(ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "error", error.getMessage()))));
    }
}
