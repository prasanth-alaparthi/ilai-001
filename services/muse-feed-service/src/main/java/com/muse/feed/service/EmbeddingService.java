package com.muse.feed.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class EmbeddingService {

    private final WebClient webClient;
    private final String geminiApiKey;

    public EmbeddingService(
            @Value("${gemini.api.url}") String geminiApiUrl,
            @Value("${gemini.api.key}") String geminiApiKey) {
        this.webClient = WebClient.builder().baseUrl(geminiApiUrl).build();
        this.geminiApiKey = geminiApiKey;
    }

    public Mono<Float[]> getEmbedding(String text) {
        if (geminiApiKey == null || geminiApiKey.isBlank() || geminiApiKey.contains("YOUR_GOOGLE_AI_API_KEY")) {
            return Mono.error(new IllegalStateException(
                    "Google AI API Key is not configured. Please set the GOOGLE_AI_API_KEY environment variable."));
        }

        // Gemini API request body structure
        Map<String, Object> content = Map.of("parts", new Object[] { Map.of("text", text) });
        Map<String, Object> req = Map.of("model", "models/embedding-001", "content", content);

        return webClient.post()
                .uri(uriBuilder -> uriBuilder.queryParam("key", geminiApiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
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
