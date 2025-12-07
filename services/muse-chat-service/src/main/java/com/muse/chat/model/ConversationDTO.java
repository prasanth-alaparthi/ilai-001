package com.muse.chat.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ConversationDTO {
    private UUID id;
    private Conversation.ConversationType type;
    private String name;
    private Conversation.ContextType contextType;
    private String contextId;
    private LocalDateTime createdAt;
    private List<String> participantIds;
}
