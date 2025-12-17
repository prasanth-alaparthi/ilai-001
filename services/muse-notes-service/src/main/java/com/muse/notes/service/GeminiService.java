package com.muse.notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Unified LLM Service - Supports Groq (primary) and Gemini (fallback)
 * Kept as GeminiService for backward compatibility
 */
@Service
@Slf4j
public class GeminiService {

    private final WebClient groqClient;
    private final WebClient geminiClient;
    private final String groqApiKey;
    private final String geminiApiKey;
    private final String provider;
    private final String groqModel;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GEMINI_MODEL = "gemini-2.5-flash";
    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL
            + ":generateContent";

    public GeminiService(
            @Value("${groq.api.key:${GROQ_API_KEY:}}") String groqApiKey,
            @Value("${groq.model:llama-3.3-70b-versatile}") String groqModel,
            @Value("${gemini.api.key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${llm.provider:groq}") String provider) {
        this.groqApiKey = groqApiKey;
        this.groqModel = groqModel;
        this.geminiApiKey = geminiApiKey;
        this.provider = provider;

        this.groqClient = WebClient.builder()
                .baseUrl(GROQ_URL)
                .defaultHeader("Authorization", "Bearer " + groqApiKey)
                .build();
        this.geminiClient = WebClient.builder()
                .baseUrl(GEMINI_URL)
                .build();

        log.info("LLM Service initialized with provider: {}", provider);
    }

    public Mono<String> generateContent(String prompt) {
        // Try Groq first if configured
        if ("groq".equalsIgnoreCase(provider) && groqApiKey != null && !groqApiKey.isBlank()) {
            log.debug("Using Groq for generation");
            return generateWithGroq(prompt)
                    .onErrorResume(e -> {
                        log.warn("Groq failed, falling back to Gemini: {}", e.getMessage());
                        return generateWithGemini(prompt);
                    });
        }
        return generateWithGemini(prompt);
    }

    private Mono<String> generateWithGroq(String prompt) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> request = Map.of(
                "model", groqModel,
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 4096);

        return groqClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.value() == 429, response -> {
                    log.warn("Groq rate limit hit (429). Will retry...");
                    return Mono.error(new RateLimitException("Rate limit exceeded"));
                })
                .onStatus(status -> status.isError() && status.value() != 429,
                        response -> response.bodyToMono(String.class).flatMap(errorBody -> {
                            log.error("Groq API Error: {} - {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Groq API Error: " + errorBody));
                        }))
                .bodyToMono(JsonNode.class)
                .map(response -> {
                    JsonNode choices = response.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        return choices.get(0).path("message").path("content").asText();
                    }
                    return "I'm sorry, I couldn't generate a response.";
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                        .filter(t -> t instanceof RateLimitException)
                        .doBeforeRetry(s -> log.debug("Retrying Groq, attempt: {}", s.totalRetries() + 1)));
    }

    private Mono<String> generateWithGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException("No AI API Key configured."));
        }

        Map<String, Object> content = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> req = Map.of("contents", List.of(content));

        return geminiClient.post()
                .uri(GEMINI_URL + "?key=" + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .onStatus(status -> status.value() == 429, response -> {
                    log.warn("Gemini rate limit hit (429). Will retry...");
                    return Mono.error(new RateLimitException("Rate limit exceeded"));
                })
                .onStatus(status -> status.isError() && status.value() != 429,
                        response -> response.bodyToMono(String.class).flatMap(errorBody -> {
                            log.error("Gemini API Error: {} - {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Gemini API Error: " + errorBody));
                        }))
                .bodyToMono(JsonNode.class)
                .map(response -> {
                    JsonNode candidates = response.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && parts.size() > 0) {
                            return parts.get(0).path("text").asText();
                        }
                    }
                    return "I'm sorry, I couldn't generate a response.";
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(10))
                        .filter(t -> t instanceof RateLimitException)
                        .doBeforeRetry(s -> log.debug("Retrying Gemini, attempt: {}", s.totalRetries() + 1))
                        .onRetryExhaustedThrow((spec, signal) -> new RuntimeException(
                                "AI rate limit exceeded. Please try again in a minute.")));
    }

    private static class RateLimitException extends RuntimeException {
        public RateLimitException(String message) {
            super(message);
        }
    }
}
