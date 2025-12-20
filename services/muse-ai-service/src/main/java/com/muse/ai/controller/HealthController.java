package com.muse.ai.controller;

import com.muse.ai.service.GroqLLMClient;
import com.muse.ai.service.LLMRouterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
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
                Map<String, Object> response = new HashMap<>();
                response.put("status", "ok");
                response.put("service", "muse-ai-service");
                response.put("groq_configured", groqClient.isConfigured());
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.ok(response);
        }

        /**
         * Test Groq connection - sends a simple request to verify Groq API is working
         * GET /api/ai/test-groq
         */
        @GetMapping("/test-groq")
        public Mono<ResponseEntity<Map<String, Object>>> testGroq() {
                if (!groqClient.isConfigured()) {
                        Map<String, Object> error = new HashMap<>();
                        error.put("success", false);
                        error.put("error", "Groq API key is not configured. Set GROQ_API_KEY environment variable.");
                        return Mono.just(ResponseEntity.badRequest().body(error));
                }

                return groqClient.generateContent(
                                "Say 'Hello from ILAI!' and nothing else.",
                                "You are a test bot. Only respond with exactly what is asked.")
                                .map(response -> {
                                        Map<String, Object> result = new HashMap<>();
                                        result.put("success", true);
                                        result.put("provider", "groq");
                                        result.put("model", "llama-3.3-70b-versatile");
                                        result.put("response", response);
                                        result.put("timestamp", System.currentTimeMillis());
                                        return ResponseEntity.ok(result);
                                })
                                .onErrorResume(error -> {
                                        Map<String, Object> errorResponse = new HashMap<>();
                                        errorResponse.put("success", false);
                                        errorResponse.put("error", error.getMessage());
                                        errorResponse.put("provider", "groq");
                                        return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
                                });
        }

        /**
         * Test LLM Router (tries Groq first, falls back to Gemini)
         * GET /api/ai/test-llm
         */
        @GetMapping("/test-llm")
        public Mono<ResponseEntity<Map<String, Object>>> testLLM() {
                return llmRouter.generateContent("Say 'ILAI AI is working!' and nothing else.", "assistant")
                                .map(response -> {
                                        Map<String, Object> result = new HashMap<>();
                                        result.put("success", true);
                                        result.put("response", response);
                                        result.put("timestamp", System.currentTimeMillis());
                                        return ResponseEntity.ok(result);
                                })
                                .onErrorResume(error -> {
                                        Map<String, Object> errorResponse = new HashMap<>();
                                        errorResponse.put("success", false);
                                        errorResponse.put("error", error.getMessage());
                                        return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
                                });
        }
}
