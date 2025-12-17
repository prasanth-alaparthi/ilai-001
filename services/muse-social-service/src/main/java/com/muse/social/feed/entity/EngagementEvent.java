package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Raw engagement event tracking for NeuroFeed algorithm
 */
@Entity
@Table(name = "engagement_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngagementEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "time_spent_seconds")
    @Builder.Default
    private Integer timeSpentSeconds = 0;

    @Column(name = "scroll_depth")
    @Builder.Default
    private Double scrollDepth = 0.0;

    @Column(name = "interaction_depth")
    @Builder.Default
    private Integer interactionDepth = 0;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "created_at")
    private Instant createdAt;

    public enum EventType {
        VIEW,
        LIKE,
        UNLIKE,
        SAVE,
        UNSAVE,
        SHARE,
        COMMENT,
        ANSWER_ATTEMPT,
        ANSWER_CORRECT,
        CLICK,
        SCROLL
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
