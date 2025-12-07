package com.muse.auth.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.muse.auth.client.dto.NoteDto; // Assuming a NoteDto exists in the client package
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class NotesServiceClient {

    private final WebClient webClient;

    public NotesServiceClient(@Value("${muse.notes-service.url:http://localhost:8082}") String notesServiceBaseUrl) {
        this.webClient = WebClient.builder().baseUrl(notesServiceBaseUrl).build();
    }

    public Mono<NoteDto> getNoteById(Long noteId, String accessToken) {
        return webClient.get()
                .uri("/api/notes/notes/{noteId}", noteId)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(), clientResponse ->
                        Mono.error(new RuntimeException("Failed to get note by ID: " + clientResponse.statusCode())))
                .bodyToMono(NoteDto.class);
    }

    public Mono<NoteDto> createNoteFromContent(String title, JsonNode content, String accessToken) {
        Map<String, Object> body = Map.of("title", title, "content", content);
        return webClient.post()
                .uri("/api/notes/notes/from-content")
                .header("Authorization", "Bearer " + accessToken)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(), clientResponse ->
                        Mono.error(new RuntimeException("Failed to create note from content: " + clientResponse.statusCode())))
                .bodyToMono(NoteDto.class);
    }

    public Mono<Long> getNoteCountForUser(String accessToken) {
        return webClient.get()
                .uri("/api/notes/count")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> Long.valueOf(response.get("count").toString()));
    }
}
