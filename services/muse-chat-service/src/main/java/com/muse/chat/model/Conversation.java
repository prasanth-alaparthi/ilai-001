package com.muse.chat.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ConversationType type;

    private String name; // For group chats

    // Context for linking to other modules
    @Column(name = "context_type")
    @Enumerated(EnumType.STRING)
    private ContextType contextType;

    @Column(name = "context_id")
    private String contextId; // UUID or ID of the related entity (Classroom, Project, etc.)

    @Column(name = "last_message_id")
    private UUID lastMessageId;

    @ElementCollection
    @CollectionTable(name = "conversation_unread_counts", joinColumns = @JoinColumn(name = "conversation_id"))
    @MapKeyColumn(name = "user_id")
    @Column(name = "unread_count")
    private java.util.Map<String, Integer> unreadCounts;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ConversationType {
        DIRECT, GROUP, AI
    }

    public enum ContextType {
        GENERAL, // Normal DM or Group
        CLASSROOM, // Linked to a Classroom
        PROJECT, // Linked to a Project/Assignment
        CLUB, // Linked to a Club
        JOURNAL, // Linked to a Journal Entry (discussion)
        PARENT_TEACHER // Specific PTM context
    }

    public UUID getId() {
        return id;
    }

    public ConversationType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public ContextType getContextType() {
        return contextType;
    }

    public String getContextId() {
        return contextId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
