package com.muse.notes.labs.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class LabAiService {

    private final WebClient webClient;
    private final String apiKey;
    private static final String MODEL = "gemini-2.5-flash";
    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL
            + ":generateContent";

    public LabAiService(@Value("${gemini.api.key:${GEMINI_API_KEY:}}") String apiKey) {
        this.webClient = WebClient.builder().build();
        this.apiKey = apiKey;
    }

    public Mono<String> solveEquation(String equation) {
        String prompt = "Solve the following math or physics equation step-by-step. Provide the final answer clearly. Equation: "
                + equation;
        return callAi(prompt);
    }

    public Mono<String> balanceReaction(String reaction) {
        String prompt = "Balance the following chemical reaction and explain the stoichiometry. Reaction: " + reaction;
        return callAi(prompt);
    }

    public Mono<String> explainConcept(String concept) {
        String prompt = "Explain the following scientific concept simply and clearly, suitable for a student. Concept: "
                + concept;
        return callAi(prompt);
    }

    private Mono<String> callAi(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return Mono.error(new IllegalStateException("API Key not configured"));
        }

        Map<String, Object> content = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> req = Map.of("contents", List.of(content));

        return webClient.post()
                .uri(API_URL + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(resp -> {
                    JsonNode candidates = resp.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && parts.size() > 0) {
                            return parts.get(0).path("text").asText();
                        }
                    }
                    return "Failed to generate response.";
                })
                .timeout(Duration.ofSeconds(60))
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(10))
                        .doBeforeRetry(signal -> System.out
                                .println("Retrying AI call, attempt: " + (signal.totalRetries() + 1))));
    }
}
