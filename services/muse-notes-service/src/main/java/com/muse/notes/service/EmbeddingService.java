package com.muse.notes.service;

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

    public EmbeddingService(@Value("${gemini.embedding-key:${GEMINI_API_KEY:}}") String geminiApiKey) {
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent")
                .build();
        this.geminiApiKey = geminiApiKey;
    }

    public Mono<float[]> getEmbedding(String text) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException(
                    "Google AI API Key is not configured. Please set GEMINI_API_KEY environment variable."));
        }

        if (text == null || text.isBlank()) {
            return Mono.just(new float[768]);
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
                        float[] embedding = new float[embeddingNode.size()];
                        for (int i = 0; i < embeddingNode.size(); i++) {
                            embedding[i] = (float) embeddingNode.get(i).asDouble();
                        }
                        return embedding;
                    }
                    throw new RuntimeException(
                            "Failed to parse embedding from Gemini response: " + response.toString());
                });
    }

    public static float cosineSimilarity(float[] vectorA, float[] vectorB) {
        if (vectorA == null || vectorB == null || vectorA.length != vectorB.length) {
            return 0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0 || normB == 0)
            return 0;
        return (float) (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
    }
}
