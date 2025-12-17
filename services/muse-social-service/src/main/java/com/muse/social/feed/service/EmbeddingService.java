package com.muse.social.feed.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
public class EmbeddingService {

    private final WebClient webClient;
    private final String geminiApiKey;

    public EmbeddingService(@Value("${gemini.api.key:${GEMINI_API_KEY:}}") String geminiApiKey) {
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent")
                .build();
        this.geminiApiKey = geminiApiKey;
    }

    public Mono<Float[]> getEmbedding(String text) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException(
                    "Google AI API Key is not configured. Please set GEMINI_API_KEY environment variable."));
        }

        if (text == null || text.isBlank()) {
            return Mono.just(new Float[768]);
        }

        Map<String, Object> content = Map.of("parts", new Object[] { Map.of("text", text) });
        Map<String, Object> req = Map.of("content", content);

        return webClient.post()
                .uri(uriBuilder -> uriBuilder.queryParam("key", geminiApiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    return response.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error("Gemini Embedding API Error: {} - {}", response.statusCode(), errorBody);
                                return Mono.error(new RuntimeException(
                                        "Gemini Embedding API Error: " + response.statusCode() + " - " + errorBody));
                            });
                })
                .bodyToMono(JsonNode.class)
                .map(response -> {
                    JsonNode embeddingNode = response.path("embedding").path("values");
                    if (embeddingNode.isArray()) {
                        Float[] embedding = new Float[embeddingNode.size()];
                        for (int i = 0; i < embeddingNode.size(); i++) {
                            embedding[i] = (float) embeddingNode.get(i).asDouble();
                        }
                        return embedding;
                    }
                    throw new RuntimeException(
                            "Failed to parse embedding from Gemini response: " + response.toString());
                });
    }
}
