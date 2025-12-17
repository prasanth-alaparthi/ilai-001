package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * FlashcardReview - Tracks FSRS state for each flashcard
 * Stores stability, difficulty, and scheduling data
 */
@Entity
@Table(name = "flashcard_reviews", indexes = {
        @Index(name = "idx_flashcard_user", columnList = "flashcard_id, user_id"),
        @Index(name = "idx_user_next_review", columnList = "user_id, next_review_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flashcard_id", nullable = false)
    private UUID flashcardId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Rating given (1=Again, 2=Hard, 3=Good, 4=Easy)
    @Column(nullable = false)
    private Integer rating;

    // When this review happened
    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    // When next review is scheduled
    @Column(name = "next_review_date", nullable = false)
    private LocalDate nextReviewDate;

    // Days until next review
    @Column(nullable = false)
    private Integer interval;

    // FSRS Stability - how long until 90% recall probability (in days)
    @Column(nullable = false)
    private Double stability;

    // FSRS Difficulty - how hard this card is (1-10)
    @Column(nullable = false)
    private Double difficulty;

    // Total successful reviews
    @Column(nullable = false)
    @Builder.Default
    private Integer reps = 0;

    // Total failures (rated "Again")
    @Column(nullable = false)
    @Builder.Default
    private Integer lapses = 0;
}
