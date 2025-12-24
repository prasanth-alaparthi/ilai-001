package com.muse.social.chat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for WebSocket message broadcasting
 * Avoids lazy loading and circular reference issues
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    private UUID id;
    private UUID conversationId;
    private String senderId;
    private String content;
    private Message.MessageType type;
    private LocalDateTime createdAt;
    private Message.MessageStatus status;
    private UUID replyToId;
    private String mediaUrl;

    public static MessageDTO fromEntity(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .senderId(message.getSenderId())
                .content(message.getContent())
                .type(message.getType())
                .createdAt(message.getCreatedAt())
                .status(message.getStatus())
                .replyToId(message.getReplyToId())
                .mediaUrl(message.getMediaUrl())
                .build();
    }
}
