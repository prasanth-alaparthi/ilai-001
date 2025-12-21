package com.muse.social.domain.bounty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Bounty Entity - DDD Domain Layer.
 * 
 * Location: domain/bounty/entity
 * 
 * A bounty represents an academic problem posted by a student
 * that offers reputation points as a reward for solving.
 */
@Entity
@Table(name = "bounties", indexes = {
        @Index(name = "idx_bounty_status", columnList = "status"),
        @Index(name = "idx_bounty_subject", columnList = "subject, status"),
        @Index(name = "idx_bounty_creator", columnList = "creator_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bounty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(name = "linked_note_id")
    private Long linkedNoteId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String subject; // math | physics | chemistry | cs | general

    @Column(length = 20)
    @Builder.Default
    private String difficulty = "medium"; // easy | medium | hard | expert

    @Column(name = "reward_points", nullable = false)
    @Builder.Default
    private Integer rewardPoints = 10;

    @Column(length = 20)
    @Builder.Default
    private String status = "open"; // open | claimed | solved | expired | canceled

    @Column(name = "solver_id")
    private Long solverId;

    @Column(name = "solution_note_id")
    private Long solutionNoteId;

    private LocalDateTime deadline;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "attempt_count")
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(length = 500)
    private String tags;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "solved_at")
    private LocalDateTime solvedAt;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Business methods
    public boolean isOpen() {
        return "open".equals(status);
    }

    public boolean isSolved() {
        return "solved".equals(status);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
