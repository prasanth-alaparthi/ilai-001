package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * User Gamification Stats - Tracks XP, level, streaks, and cumulative
 * achievements
 */
@Entity
@Table(name = "user_gamification")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGamification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "total_xp")
    @Builder.Default
    private Long totalXp = 0L;

    @Builder.Default
    private Integer level = 1;

    @Column(name = "current_streak")
    @Builder.Default
    private Integer currentStreak = 0;

    @Column(name = "longest_streak")
    @Builder.Default
    private Integer longestStreak = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "total_study_minutes")
    @Builder.Default
    private Integer totalStudyMinutes = 0;

    @Column(name = "notes_created")
    @Builder.Default
    private Integer notesCreated = 0;

    @Column(name = "quizzes_completed")
    @Builder.Default
    private Integer quizzesCompleted = 0;

    @Column(name = "flashcards_reviewed")
    @Builder.Default
    private Integer flashcardsReviewed = 0;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Calculate level from XP
     * Level = floor(sqrt(XP / 100)) + 1
     * Level 1: 0-99 XP
     * Level 2: 100-399 XP
     * Level 5: 1600-2499 XP
     * Level 10: 8100-9999 XP
     */
    public static int calculateLevel(long xp) {
        return (int) Math.floor(Math.sqrt(xp / 100.0)) + 1;
    }

    /**
     * XP needed for a specific level
     */
    public static long xpForLevel(int level) {
        return (long) Math.pow(level - 1, 2) * 100;
    }

    /**
     * Progress to next level (0.0 to 1.0)
     */
    public double getProgressToNextLevel() {
        long currentLevelXp = xpForLevel(this.level);
        long nextLevelXp = xpForLevel(this.level + 1);
        long range = nextLevelXp - currentLevelXp;
        long progress = this.totalXp - currentLevelXp;
        return Math.min(1.0, Math.max(0.0, (double) progress / range));
    }

    /**
     * Update level based on current XP
     */
    public boolean updateLevel() {
        int newLevel = calculateLevel(this.totalXp);
        if (newLevel != this.level) {
            this.level = newLevel;
            return true; // Level changed
        }
        return false;
    }
}
