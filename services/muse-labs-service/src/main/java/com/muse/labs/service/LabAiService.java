package com.muse.labs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class LabAiService {

    private final WebClient webClient;
    private final String apiKey;
    private final String model = "llama-3.3-70b-versatile"; // Using same model as Notes service
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LabAiService(@Value("${gemini.api.key}") String apiKey) {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
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

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> req = Map.of(
                "model", model,
                "messages", List.of(message),
                "temperature", 0.3);

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(resp -> {
                    JsonNode choices = resp.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        return choices.get(0).path("message").path("content").asText();
                    }
                    return "Failed to generate response.";
                })
                .timeout(Duration.ofSeconds(60));
    }
}
