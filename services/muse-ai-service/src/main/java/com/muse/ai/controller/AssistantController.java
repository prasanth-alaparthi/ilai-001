package com.muse.ai.controller;

import com.muse.ai.entity.Conversation;
import com.muse.ai.entity.Message;
import com.muse.ai.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    /**
     * Get current user ID from authentication
     */
    private Long getUserId(Authentication auth) {
        return (Long) auth.getDetails();
    }

    /**
     * Start a new conversation
     */
    @PostMapping("/conversations")
    public ResponseEntity<Conversation> startConversation(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        Long userId = getUserId(auth);
        String title = request.getOrDefault("title", "New Conversation");
        String contextType = request.get("contextType");
        String contextId = request.get("contextId");

        Conversation conversation = assistantService.startConversation(userId, title, contextType, contextId);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Get user's conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<Conversation>> getConversations(Authentication auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(assistantService.getUserConversations(userId));
    }

    /**
     * Get messages in a conversation
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(assistantService.getMessages(id));
    }

    /**
     * Send a message and get AI response
     */
    @PostMapping("/conversations/{id}/chat")
    public Mono<ResponseEntity<Message>> chat(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        Long userId = getUserId(auth);
        String message = request.get("message");

        return assistantService.chat(id, userId, message)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError().build()));
    }

    /**
     * Quick chat without conversation history
     */
    @PostMapping("/quick-chat")
    public Mono<ResponseEntity<Map<String, String>>> quickChat(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        Long userId = getUserId(auth);
        String message = request.get("message");

        return assistantService.quickChat(userId, message)
                .map(response -> ResponseEntity.ok(Map.of("response", response)))
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body(Map.of("error", e.getMessage()))));
    }

    /**
     * Delete a conversation
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID id) {
        assistantService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }
}
