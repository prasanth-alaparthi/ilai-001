package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
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
 * Groq LLM Client - OpenAI-compatible API
 * Uses Groq's ultra-fast LPU inference (300+ tokens/sec)
 * Free tier: 30 req/min, 14,400 req/day
 */
@Service
@Slf4j
public class GroqLLMClient {

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final WebClient webClient;
    private final String groqApiKey;
    private final String defaultModel;

    public GroqLLMClient(
            @Value("${groq.api.key:${GROQ_API_KEY:}}") String groqApiKey,
            @Value("${groq.model:llama-3.3-70b-versatile}") String defaultModel) {
        this.groqApiKey = groqApiKey;
        this.defaultModel = defaultModel;
        this.webClient = WebClient.builder()
                .baseUrl(GROQ_API_URL)
                .defaultHeader("Authorization", "Bearer " + groqApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    /**
     * Check if Groq is configured
     */
    public boolean isConfigured() {
        return groqApiKey != null && !groqApiKey.isBlank();
    }

    /**
     * Generate content using Groq API
     */
    public Mono<String> generateContent(String prompt) {
        return generateContent(prompt, null);
    }

    /**
     * Generate content with system instruction
     */
    public Mono<String> generateContent(String prompt, String systemInstruction) {
        if (!isConfigured()) {
            log.debug("Groq API key not configured, returning empty");
            return Mono.error(new IllegalStateException("Groq API Key is not configured."));
        }

        List<Map<String, String>> messages = new java.util.ArrayList<>();

        if (systemInstruction != null && !systemInstruction.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemInstruction));
        }
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> request = Map.of(
                "model", defaultModel,
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 4096);

        return webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.value() == 429, response -> {
                    log.warn("Groq rate limit hit (429). Will retry...");
                    return Mono.error(new RateLimitException("Rate limit exceeded"));
                })
                .onStatus(status -> status.isError() && status.value() != 429,
                        response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Groq API Error: {} - {}", response.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Groq API Error: " + errorBody));
                                }))
                .bodyToMono(JsonNode.class)
                .map(this::extractTextFromResponse)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                        .filter(throwable -> throwable instanceof RateLimitException)
                        .doBeforeRetry(signal -> log.info("Retrying Groq after rate limit, attempt: {}",
                                signal.totalRetries() + 1)));
    }

    /**
     * Generate with conversation history
     */
    public Mono<String> generateWithHistory(List<Map<String, String>> history, String newMessage) {
        if (!isConfigured()) {
            return Mono.error(new IllegalStateException("Groq API Key is not configured."));
        }

        List<Map<String, String>> messages = new java.util.ArrayList<>(history);
        messages.add(Map.of("role", "user", "content", newMessage));

        Map<String, Object> request = Map.of(
                "model", defaultModel,
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 4096);

        return webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.isError(),
                        response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new RuntimeException("API Error: " + errorBody))))
                .bodyToMono(JsonNode.class)
                .map(this::extractTextFromResponse);
    }

    /**
     * Extract text from OpenAI-compatible response
     */
    private String extractTextFromResponse(JsonNode response) {
        JsonNode choices = response.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            JsonNode message = choices.get(0).path("message");
            String content = message.path("content").asText();
            if (content != null && !content.isEmpty()) {
                return content;
            }
        }
        log.warn("Could not extract text from Groq response: {}", response);
        return "I'm sorry, I couldn't generate a response.";
    }

    private static class RateLimitException extends RuntimeException {
        public RateLimitException(String message) {
            super(message);
        }
    }
}
