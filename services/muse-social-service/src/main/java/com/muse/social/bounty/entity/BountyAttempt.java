package com.muse.social.bounty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tracks attempts to solve bounties.
 */
@Entity
@Table(name = "bounty_attempts", indexes = {
        @Index(name = "idx_attempt_bounty", columnList = "bounty_id"),
        @Index(name = "idx_attempt_user", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BountyAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bounty_id", nullable = false)
    private Long bountyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "solution_note_id")
    private Long solutionNoteId;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "status")
    @Builder.Default
    private String status = "pending"; // pending | accepted | rejected

    @Column(name = "reviewer_id")
    private Long reviewerId; // Who reviewed this attempt

    @Column(name = "review_comment")
    private String reviewComment;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
