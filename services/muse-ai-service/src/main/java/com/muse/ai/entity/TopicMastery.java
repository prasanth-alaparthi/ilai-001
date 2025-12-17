package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Topic Mastery Entity - Tracks mastery level for each topic
 */
@Entity
@Table(name = "topic_mastery", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "topic" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicMastery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "mastery_level")
    @Builder.Default
    private Double masteryLevel = 0.0; // 0.0 to 1.0

    @Column(name = "exposure_count")
    @Builder.Default
    private Integer exposureCount = 0;

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt;

    @Column(name = "avg_quiz_score")
    private Double avgQuizScore;

    @Column(name = "retention_rate")
    private Double retentionRate;

    @Column(name = "confidence_level", length = 20)
    private String confidenceLevel; // low, medium, high

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void recordExposure() {
        this.exposureCount++;
        this.lastStudiedAt = LocalDateTime.now();
        updateConfidenceLevel();
    }

    public void updateMastery(double score) {
        // Weighted average: 70% old mastery, 30% new score
        this.masteryLevel = (this.masteryLevel * 0.7) + (score * 0.3);
        updateConfidenceLevel();
    }

    private void updateConfidenceLevel() {
        if (this.masteryLevel >= 0.8 && this.exposureCount >= 5) {
            this.confidenceLevel = "high";
        } else if (this.masteryLevel >= 0.5 && this.exposureCount >= 3) {
            this.confidenceLevel = "medium";
        } else {
            this.confidenceLevel = "low";
        }
    }
}
