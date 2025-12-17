package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Tracks user interest in specific hashtags for NeuroFeed algorithm
 */
@Entity
@Table(name = "user_interest_dna", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "hashtag" }))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInterestDNA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 100)
    private String hashtag;

    // Core scores
    @Column(name = "interest_score")
    @Builder.Default
    private Double interestScore = 0.0;

    @Column(name = "learning_velocity")
    @Builder.Default
    private Double learningVelocity = 0.0;

    @Column
    @Builder.Default
    private Double momentum = 1.0;

    // Engagement counts
    @Column(name = "total_views")
    @Builder.Default
    private Integer totalViews = 0;

    @Column(name = "total_likes")
    @Builder.Default
    private Integer totalLikes = 0;

    @Column(name = "total_saves")
    @Builder.Default
    private Integer totalSaves = 0;

    @Column(name = "total_time_seconds")
    @Builder.Default
    private Integer totalTimeSeconds = 0;

    @Column(name = "correct_answers")
    @Builder.Default
    private Integer correctAnswers = 0;

    // Learning level
    @Enumerated(EnumType.STRING)
    @Column(name = "current_level")
    @Builder.Default
    private LearningLevel currentLevel = LearningLevel.BEGINNER;

    @Column(name = "first_interaction")
    private Instant firstInteraction;

    @Column(name = "last_interaction")
    private Instant lastInteraction;

    public enum LearningLevel {
        BEGINNER, INTERMEDIATE, ADVANCED
    }

    @PrePersist
    protected void onCreate() {
        this.firstInteraction = Instant.now();
        this.lastInteraction = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastInteraction = Instant.now();
    }
}
