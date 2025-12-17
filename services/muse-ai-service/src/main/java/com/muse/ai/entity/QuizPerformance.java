package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Quiz Performance Entity - Tracks quiz results for weakness detection
 */
@Entity
@Table(name = "quiz_performance")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quiz_id")
    private Long quizId;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "questions_total", nullable = false)
    private Integer questionsTotal;

    @Column(name = "questions_correct", nullable = false)
    private Integer questionsCorrect;

    @Column(name = "score_percentage", nullable = false)
    private Double scorePercentage;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;

    @Column(name = "difficulty_level", length = 20)
    private String difficultyLevel; // easy, medium, hard

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weak_areas", columnDefinition = "jsonb")
    private List<String> weakAreas;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.scorePercentage == null && this.questionsTotal > 0) {
            this.scorePercentage = (double) this.questionsCorrect / this.questionsTotal * 100;
        }
    }
}
