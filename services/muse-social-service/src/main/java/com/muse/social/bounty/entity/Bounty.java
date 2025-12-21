package com.muse.social.bounty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * BountyBoard: Problems posted by users, linked to notes.
 * Other users can solve bounties to earn reputation points.
 */
@Entity
@Table(name = "bounties", indexes = {
        @Index(name = "idx_bounty_status", columnList = "status"),
        @Index(name = "idx_bounty_subject", columnList = "subject"),
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
    private Long linkedNoteId; // Reference to muse-notes-service

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "subject")
    private String subject; // math | physics | chemistry | cs | general

    @Column(name = "difficulty")
    @Builder.Default
    private String difficulty = "medium"; // easy | medium | hard | expert

    @Column(name = "reward_points", nullable = false)
    @Builder.Default
    private Integer rewardPoints = 10;

    @Column(name = "status")
    @Builder.Default
    private String status = "open"; // open | claimed | solved | expired | canceled

    @Column(name = "solver_id")
    private Long solverId;

    @Column(name = "solution_note_id")
    private Long solutionNoteId; // Link to solver's note

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "attempt_count")
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "tags")
    private String tags; // Comma-separated tags

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "solved_at")
    private LocalDateTime solvedAt;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper methods
    public boolean isOpen() {
        return "open".equals(this.status);
    }

    public boolean isSolved() {
        return "solved".equals(this.status);
    }

    public boolean isExpired() {
        return deadline != null && LocalDateTime.now().isAfter(deadline);
    }
}
