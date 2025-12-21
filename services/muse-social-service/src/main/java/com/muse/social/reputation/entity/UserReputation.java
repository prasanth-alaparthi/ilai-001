package com.muse.social.reputation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * User reputation profile for gamification.
 * Tracks points, streaks, and level progression.
 */
@Entity
@Table(name = "user_reputation", indexes = {
        @Index(name = "idx_reputation_user", columnList = "user_id"),
        @Index(name = "idx_reputation_score", columnList = "total_score")
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

    @Column(name = "level")
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

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.level = calculateLevel();
    }

    /**
     * Calculate level based on total score.
     * Level thresholds: 0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500...
     */
    public int calculateLevel() {
        if (totalScore < 100)
            return 1;
        if (totalScore < 300)
            return 2;
        if (totalScore < 600)
            return 3;
        if (totalScore < 1000)
            return 4;
        if (totalScore < 1500)
            return 5;
        if (totalScore < 2100)
            return 6;
        if (totalScore < 2800)
            return 7;
        if (totalScore < 3600)
            return 8;
        if (totalScore < 4500)
            return 9;
        return 10;
    }

    /**
     * Add points and update score.
     */
    public void addPoints(int points) {
        this.totalScore += points;
        this.level = calculateLevel();
        this.lastActivityDate = LocalDateTime.now();
    }
}
