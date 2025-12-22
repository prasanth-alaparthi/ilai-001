package com.muse.social.chat.controller;

import com.muse.social.chat.model.Conversation;
import com.muse.social.chat.model.Message;
import com.muse.social.chat.service.ChatService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations")
    public com.muse.social.chat.model.ConversationDTO createConversation(@AuthenticationPrincipal String userId,
            @RequestBody CreateConversationRequest req) {
        Conversation c = chatService.createConversation(userId, req.getType(), req.getName(), req.getParticipantIds(),
                req.getContextType(), req.getContextId());
        return chatService.toDTO(c);
    }

    @GetMapping("/conversations")
    public List<com.muse.social.chat.model.ConversationDTO> getConversations(@AuthenticationPrincipal String userId,
            @RequestParam(required = false) Conversation.ContextType contextType,
            @RequestParam(required = false) String contextId) {
        if (contextType != null && contextId != null) {
            return chatService.getConversationsByContext(contextType, contextId);
        }
        return chatService.getUserConversations(userId);
    }

    @GetMapping("/conversations/{id}/messages")
    public Page<Message> getMessages(@PathVariable UUID id, Pageable pageable) {
        return chatService.getMessages(id, pageable);
    }

    @PostMapping("/conversations/{id}/messages")
    public Message sendMessage(@AuthenticationPrincipal String userId, @PathVariable UUID id,
            @RequestBody SendMessageRequest req) {
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
