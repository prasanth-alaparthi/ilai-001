package com.muse.chat.controller;

import com.muse.chat.model.Conversation;
import com.muse.chat.model.Message;
import com.muse.chat.service.ChatService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations")
    public com.muse.chat.model.ConversationDTO createConversation(@AuthenticationPrincipal Jwt jwt,
            @RequestBody CreateConversationRequest req) {
        String userId = jwt.getSubject();
        Conversation c = chatService.createConversation(userId, req.getType(), req.getName(), req.getParticipantIds(),
                req.getContextType(), req.getContextId());
        return chatService.toDTO(c);
    }

    @GetMapping("/conversations")
    public List<com.muse.chat.model.ConversationDTO> getConversations(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Conversation.ContextType contextType,
            @RequestParam(required = false) String contextId) {
        if (contextType != null && contextId != null) {
            return chatService.getConversationsByContext(contextType, contextId);
        }
        return chatService.getUserConversations(jwt.getSubject());
    }

    @GetMapping("/conversations/{id}/messages")
    public Page<Message> getMessages(@PathVariable UUID id, Pageable pageable) {
        return chatService.getMessages(id, pageable);
    }

    @PostMapping("/conversations/{id}/messages")
    public Message sendMessage(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestBody SendMessageRequest req) {
        String userId = jwt.getSubject();
        return chatService.sendMessage(userId, id, req.getContent(), req.getType(), req.getMediaUrl(),
                req.getReplyToId());
    }

    @Data
    public static class CreateConversationRequest {
        private Conversation.ConversationType type;
        private String name;
        private List<String> participantIds;
        private Conversation.ContextType contextType;
        private String contextId;
    }

    @Data
    public static class SendMessageRequest {
        private String content;
        private Message.MessageType type = Message.MessageType.TEXT;
        private String mediaUrl;
        private UUID replyToId;
    }
}
