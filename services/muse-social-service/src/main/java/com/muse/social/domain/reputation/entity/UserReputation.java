package com.muse.social.domain.reputation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * UserReputation Entity - DDD Domain Layer.
 * 
 * Tracks user's reputation score, level (1-10), and gamification metrics.
 */
@Entity
@Table(name = "user_reputation", indexes = {
        @Index(name = "idx_reputation_score", columnList = "total_score DESC"),
        @Index(name = "idx_reputation_level", columnList = "level")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReputation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "total_score")
    @Builder.Default
    private Integer totalScore = 0;

    @Builder.Default
    private Integer level = 1;

    @Column(name = "streak_days")
    @Builder.Default
    private Integer streakDays = 0;

    @Column(name = "longest_streak")
    @Builder.Default
    private Integer longestStreak = 0;

    @Column(name = "bounties_created")
    @Builder.Default
    private Integer bountiesCreated = 0;

    @Column(name = "bounties_solved")
    @Builder.Default
    private Integer bountiesSolved = 0;

    @Column(name = "notes_shared")
    @Builder.Default
    private Integer notesShared = 0;

    @Column(name = "upvotes_received")
    @Builder.Default
    private Integer upvotesReceived = 0;

    @Column(name = "upvotes_given")
    @Builder.Default
    private Integer upvotesGiven = 0;

    @Column(name = "last_activity_date")
    private LocalDateTime lastActivityDate;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Business method: Add points
    public void addPoints(int points) {
        this.totalScore = Math.max(0, this.totalScore + points);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
