package com.muse.social.feed.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference; // Correct import
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Component
public class NotesServiceClient {

        private final WebClient webClient;
        private final ObjectMapper objectMapper;

        public NotesServiceClient(@Value("${muse.notes-service.url:http://localhost:8082}") String notesServiceBaseUrl,
                        ObjectMapper objectMapper) {
                this.webClient = WebClient.builder().baseUrl(notesServiceBaseUrl).build();
                this.objectMapper = objectMapper;
        }

        public Mono<Map<String, Object>> createNoteFromContent(String title, String content, String accessToken) {
                JsonNode jsonContent = objectMapper.createObjectNode()
                                .put("type", "doc")
                                .set("content", objectMapper.createArrayNode()
                                                .add(objectMapper.createObjectNode()
                                                                .put("type", "paragraph")
                                                                .set("content", objectMapper.createArrayNode()
                                                                                .add(objectMapper.createObjectNode()
                                                                                                .put("type", "text")
                                                                                                .put("text", content)))));

                Map<String, Object> noteBody = Map.of("title", title, "content", jsonContent);

                // 1. Get Notebooks
                return webClient.get()
                                .uri("/api/notebooks")
                                .header("Authorization", "Bearer " + accessToken)
                                .retrieve()
                                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                                })
                                .flatMap(notebooks -> {
                                        if (notebooks.isEmpty()) {
                                                // Create default notebook
                                                return webClient.post()
                                                                .uri("/api/notebooks")
                                                                .header("Authorization", "Bearer " + accessToken)
                                                                .bodyValue(Map.of("title", "Quick Notes", "color",
                                                                                "#3b82f6"))
                                                                .retrieve()
                                                                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                                                                });
                                        } else {
                                                return Mono.just(notebooks.get(0));
                                        }
                                })
                                .flatMap(notebook -> {
                                        Long notebookId = ((Number) notebook.get("id")).longValue();
                                        // 2. Get Sections
                                        return webClient.get()
                                                        .uri("/api/notebooks/" + notebookId + "/sections")
                                                        .header("Authorization", "Bearer " + accessToken)
                                                        .retrieve()
                                                        .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                                                        })
                                                        .flatMap(sections -> {
                                                                if (sections.isEmpty()) {
                                                                        // Create default section
                                                                        return webClient.post()
                                                                                        .uri("/api/notebooks/"
                                                                                                        + notebookId
                                                                                                        + "/sections")
                                                                                        .header("Authorization",
                                                                                                        "Bearer " + accessToken)
                                                                                        .bodyValue(Map.of("title",
                                                                                                        "Saved Posts"))
                                                                                        .retrieve()
                                                                                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                                                                                        });
                                                                } else {
                                                                        return Mono.just(sections.get(0));
                                                                }
                                                        });
                                })
                                .flatMap(section -> {
                                        Long sectionId = ((Number) section.get("id")).longValue();
                                        // 3. Create Note
                                        return webClient.post()
                                                        .uri("/api/sections/" + sectionId + "/notes")
                                                        .header("Authorization", "Bearer " + accessToken)
                                                        .bodyValue(noteBody)
                                                        .retrieve()
                                                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                                                        });
                                })
                                .onErrorResume(e -> Mono.error(
                                                new RuntimeException("Failed to create note: " + e.getMessage())));
        }

        public Mono<Map<String, Object>> elaborateContent(String content, String accessToken) {
                Map<String, Object> body = Map.of("content", content, "level", "detailed");

                return webClient.post()
                                .uri("/api/ai/explain")
                                .header("Authorization", "Bearer " + accessToken)
                                .bodyValue(body)
                                .retrieve()
                                .onStatus(status -> status.isError(), clientResponse -> Mono.error(new RuntimeException(
                                                "Failed to get AI elaboration: " + clientResponse.statusCode())))
                                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                                }); // Correct usage
        }
}
