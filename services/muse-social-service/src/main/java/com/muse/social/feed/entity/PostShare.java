package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Post share tracking
 */
@Entity
@Table(name = "post_shares")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "shared_by", nullable = false)
    private String sharedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "share_type", nullable = false)
    private ShareType shareType;

    @Column(name = "target_conversation_id")
    private UUID targetConversationId;

    @Column(name = "target_group_id")
    private UUID targetGroupId;

    @Column(name = "repost_comment", columnDefinition = "TEXT")
    private String repostComment;

    @Column(name = "created_at")
    private Instant createdAt;

    public enum ShareType {
        CHAT, GROUP, REPOST, EXTERNAL
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
