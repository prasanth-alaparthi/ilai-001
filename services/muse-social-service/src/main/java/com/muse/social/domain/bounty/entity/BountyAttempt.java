package com.muse.social.domain.bounty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * BountyAttempt Entity - DDD Domain Layer.
 * 
 * Represents a solution attempt for a bounty.
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

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(length = 20)
    @Builder.Default
    private String status = "pending"; // pending | accepted | rejected

    @Column(name = "reviewer_id")
    private Long reviewerId;

    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
