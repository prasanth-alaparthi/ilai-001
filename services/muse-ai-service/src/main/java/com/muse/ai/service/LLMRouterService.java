package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Centralized LLM Router Service - Phase 2 Enhanced
 * All AI requests from any service should route through here.
 * Supports Groq (primary) and Gemini (fallback) providers.
 */
@Service
@Slf4j
public class LLMRouterService {

    private final WebClient webClient;
    private final GroqLLMClient groqClient;
    private final String geminiApiKey;
    private final String model;
    private final String provider;

    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    public LLMRouterService(
            GroqLLMClient groqClient,
            @Value("${gemini.api.key:}") String geminiApiKey,
            @Value("${gemini.model:gemini-2.5-flash}") String model,
            @Value("${llm.provider:groq}") String provider) {
        this.groqClient = groqClient;
        this.geminiApiKey = geminiApiKey;
        this.model = model;
        this.provider = provider;
        this.webClient = WebClient.builder().build();
        log.info("LLMRouterService initialized with provider: {}", provider);
    }

    /**
     * Generate content using configured provider
     */
    public Mono<String> generateContent(String prompt) {
        return generateContent(prompt, null);
    }

    /**
     * Generate content with system instruction
     * Protected by circuit breaker and rate limiter
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "generateContentFallback")
    @RateLimiter(name = "llm")
    public Mono<String> generateContent(String prompt, String systemInstruction) {
        // Try Groq first if configured and selected
        if ("groq".equalsIgnoreCase(provider) && groqClient.isConfigured()) {
            log.debug("Using Groq provider for generation");
            return groqClient.generateContent(prompt, systemInstruction)
                    .onErrorResume(e -> {
                        log.warn("Groq failed, falling back to Gemini: {}", e.getMessage());
                        return generateWithGemini(prompt, systemInstruction);
                    });
        }

        // Fall back to Gemini
        return generateWithGemini(prompt, systemInstruction);
    }

    /**
     * Generate content using Gemini API
     */
    private Mono<String> generateWithGemini(String prompt, String systemInstruction) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException("Gemini API Key is not configured."));
        }

        Map<String, Object> userContent = Map.of("role", "user", "parts", List.of(Map.of("text", prompt)));

        Map<String, Object> req;
        if (systemInstruction != null && !systemInstruction.isBlank()) {
            Map<String, Object> systemContent = Map.of(
                    "parts", List.of(Map.of("text", systemInstruction)));
            req = Map.of(
                    "system_instruction", systemContent,
                    "contents", List.of(userContent));
        } else {
            req = Map.of("contents", List.of(userContent));
        }

        String apiUrl = API_URL + model + ":generateContent?key=" + geminiApiKey;

        return webClient.post()
                .uri(apiUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .onStatus(status -> status.value() == 429, response -> {
                    log.warn("Rate limit hit (429). Will retry...");
                    return Mono.error(new RateLimitException("Rate limit exceeded"));
                })
                .onStatus(status -> status.isError() && status.value() != 429,
                        response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Gemini API Error: {} - {}", response.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Gemini API Error: " + errorBody));
                                }))
                .bodyToMono(JsonNode.class)
                .map(this::extractTextFromResponse)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(10))
                        .filter(throwable -> throwable instanceof RateLimitException)
                        .doBeforeRetry(signal -> log.info("Retrying after rate limit, attempt: {}",
                                signal.totalRetries() + 1)));
    }

    /**
     * Generate content with conversation history for context
     */
    public Mono<String> generateWithHistory(List<Map<String, Object>> history, String newMessage) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException("Gemini API Key is not configured."));
        }

        history.add(Map.of("role", "user", "parts", List.of(Map.of("text", newMessage))));

        Map<String, Object> req = Map.of("contents", history);
        String apiUrl = API_URL + model + ":generateContent?key=" + geminiApiKey;

        return webClient.post()
                .uri(apiUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.bodyToMono(String.class)
                        .flatMap(errorBody -> Mono.error(new RuntimeException("API Error: " + errorBody))))
                .bodyToMono(JsonNode.class)
                .map(this::extractTextFromResponse);
    }

    /**
     * Summarize content
     */
    public Mono<String> summarize(String content) {
        String prompt = "Summarize the following content concisely:\n\n" + content;
        return generateContent(prompt);
    }

    /**
     * Explain content at a specific level
     */
    public Mono<String> explain(String content, String level) {
        String prompt = String.format(
                "Explain the following content at a %s level. Make it clear and understandable:\n\n%s",
                level, content);
        return generateContent(prompt);
    }

    /**
     * Generate flashcards from content
     */
    public Mono<String> generateFlashcards(String content) {
        String prompt = """
                Generate flashcards from the following content.
                Return as JSON array with format: [{"front": "question", "back": "answer"}]

                Content:
                """ + content;
        return generateContent(prompt);
    }

    /**
     * Generate quiz from content
     */
    public Mono<String> generateQuiz(String content) {
        String prompt = """
                Generate a quiz from the following content.
                Return as JSON with format: {
                    "questions": [
                        {"question": "...", "options": ["A", "B", "C", "D"], "correct": "A", "explanation": "..."}
                    ]
                }

                Content:
                """ + content;
        return generateContent(prompt);
    }

    /**
     * Grammar check
     */
    public Mono<String> grammarCheck(String text) {
        String prompt = """
                Check the following text for grammar errors and suggest corrections.
                Return as JSON: {"errors": [{"original": "...", "corrected": "...", "explanation": "..."}], "corrected_text": "..."}

                Text:
                """
                + text;
        return generateContent(prompt);
    }

    /**
     * Extract text from Gemini API response
     */
    private String extractTextFromResponse(JsonNode response) {
        JsonNode candidates = response.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && parts.size() > 0) {
                return parts.get(0).path("text").asText();
            }
        }
        return "I'm sorry, I couldn't generate a response.";
    }

    private static class RateLimitException extends RuntimeException {
        public RateLimitException(String message) {
            super(message);
        }
    }

    /**
     * Fallback method when circuit breaker is open or rate limit exceeded
     */
    private Mono<String> generateContentFallback(String prompt, String systemInstruction, Throwable t) {
        log.warn("LLM fallback triggered: {}", t.getMessage());
        return Mono.just(
                "I'm temporarily unable to process your request due to high demand. " +
                        "Please try again in a moment. Your request has been noted.");
    }
}
