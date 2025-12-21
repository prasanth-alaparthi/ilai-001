package com.muse.social.reputation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Reputation history for audit trail.
 * Tracks all point changes with reason and source.
 */
@Entity
@Table(name = "reputation_history", indexes = {
        @Index(name = "idx_reputation_history_user", columnList = "user_id, created_at DESC"),
        @Index(name = "idx_rep_history_composite", columnList = "user_id, source_type, created_at DESC")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReputationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "points_change", nullable = false)
    private Integer pointsChange;

    @Column(name = "reason")
    private String reason;

    @Column(name = "source_type")
    private String sourceType; // bounty | post | upvote | streak | admin

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
