package com.muse.notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final WebClient webClient;
    private final String geminiApiKey;
    private final String geminiGenerateUrl;

    public GeminiService(
            @Value("${gemini.api.key}") String geminiApiKey) {
        reactor.netty.http.client.HttpClient httpClient = reactor.netty.http.client.HttpClient.create()
                .protocol(reactor.netty.http.HttpProtocol.HTTP11);

        this.webClient = WebClient.builder()
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(httpClient))
                .build();
        this.geminiApiKey = geminiApiKey;
        this.geminiGenerateUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    }

    public Mono<String> generateContent(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException("AI API Key is not configured."));
        }

        if (geminiApiKey.startsWith("gsk_")) {
            return generateGroqContent(prompt);
        } else {
            return generateGeminiContent(prompt);
        }
    }

    private Mono<String> generateGroqContent(String prompt) {
        Map<String, Object> req = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(Map.of("role", "user", "content", prompt)));

        return webClient.post()
                .uri("https://api.groq.com/openai/v1/chat/completions")
                .header("Authorization", "Bearer " + geminiApiKey)
                .header("User-Agent", "Muse-Notes-Service")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    return response.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                System.err.println("Groq API Error: " + response.statusCode() + " - " + errorBody);
                                return Mono.error(new RuntimeException(
                                        "Groq API Error: " + response.statusCode() + " - " + errorBody));
                            });
                })
                .bodyToMono(JsonNode.class)
                .map(response -> {
                    JsonNode choices = response.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        return choices.get(0).path("message").path("content").asText();
                    }
                    return "I'm sorry, I couldn't generate a response.";
                });
    }

    private Mono<String> generateGeminiContent(String prompt) {
        Map<String, Object> content = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> req = Map.of("contents", List.of(content));

        return webClient.post()
                .uri(geminiGenerateUrl + "?key=" + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    return response.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                System.err.println("Gemini API Error: " + response.statusCode() + " - " + errorBody);
                                return Mono.error(new RuntimeException(
                                        "Gemini API Error: " + response.statusCode() + " - " + errorBody));
                            });
                })
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
                });
    }
}
