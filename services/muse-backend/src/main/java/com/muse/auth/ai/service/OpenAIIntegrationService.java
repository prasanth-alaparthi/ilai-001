package com.muse.auth.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.File;
import java.util.*;

/**
 * Minimal client to call OpenAI REST endpoints for embeddings and completions.
 * You can replace or extend this to use any provider.
 *
 * WARNING: keep OPENAI_API_KEY secret; do not expose to client.
 */
@Service
public class OpenAIIntegrationService {

    private final WebClient webClient;
    private final String apiKey;
    private final ObjectMapper mapper;

    public OpenAIIntegrationService(@Value("${OPENAI_API_KEY:}") String apiKey, ObjectMapper mapper) {
        this.apiKey = apiKey;
        this.mapper = mapper;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public double[] embed(String model, String input) {
        // Synchronous blocking .block() used for simplicity; worker runs in background.
        try {
            Map<String, Object> body = Map.of("input", input, "model", model);
            JsonNode resp = webClient.post()
                    .uri("/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            if (resp != null && resp.has("data") && resp.get("data").isArray() && resp.get("data").size() > 0) {
                JsonNode vecNode = resp.get("data").get(0).get("embedding");
                double[] arr = new double[vecNode.size()];
                for (int i=0;i<vecNode.size();i++) arr[i] = vecNode.get(i).asDouble();
                return arr;
            }
            return new double[0];
        } catch (Exception e) {
            throw new RuntimeException("OpenAI embed failed: " + e.getMessage(), e);
        }
    }

    public String summarize(String model, String prompt, int maxTokens) {
        try {
            Map<String, Object> msg = Map.of("role","user","content", prompt);
            Map<String,Object> body = Map.of("model", model, "messages", List.of(msg), "max_tokens", maxTokens);
            JsonNode resp = webClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            if (resp != null && resp.has("choices") && resp.get("choices").isArray() && resp.get("choices").size() > 0) {
                return resp.get("choices").get(0).get("message").get("content").asText();
            }
            return "";
        } catch (Exception e) {
            throw new RuntimeException("OpenAI summarize failed: " + e.getMessage(), e);
        }
    }

    public String transcribeAudio(File audioFile) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new FileSystemResource(audioFile));
            builder.part("model", "whisper-1");

            JsonNode resp = webClient.post()
                    .uri("/audio/transcriptions")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .bodyValue(builder.build())
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (resp != null && resp.has("text")) {
                return resp.get("text").asText();
            }
            return "";
        } catch (Exception e) {
            throw new RuntimeException("OpenAI audio transcription failed: " + e.getMessage(), e);
        }
    }
}
