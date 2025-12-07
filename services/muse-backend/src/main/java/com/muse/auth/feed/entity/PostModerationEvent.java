package com.muse.auth.feed.entity; // Corrected package declaration

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "feed_post_moderation_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostModerationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long postId;

    @Column(nullable = false, length = 64)
    private String authorUsername;

    @Column(nullable = false, length = 32)
    private String eventType; // e.g. "AUTO_BLOCK", "AUTO_PENDING_REVIEW"

    @Column(length = 255)
    private String reason;

    @Column(nullable = false)
    private Instant createdAt;
}