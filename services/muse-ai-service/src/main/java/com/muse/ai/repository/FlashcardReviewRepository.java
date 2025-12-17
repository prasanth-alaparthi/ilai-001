package com.muse.ai.repository;

import com.muse.ai.entity.FlashcardReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for FlashcardReview entities
 * Supports FSRS spaced repetition queries
 */
@Repository
public interface FlashcardReviewRepository extends JpaRepository<FlashcardReview, Long> {
    
    /**
     * Get latest review for a flashcard
     */
    Optional<FlashcardReview> findTopByFlashcardIdAndUserIdOrderByReviewDateDesc(
        UUID flashcardId, Long userId);
    
    /**
     * Get all flashcards due for review (on or before date)
     */
    List<FlashcardReview> findByUserIdAndNextReviewDateLessThanEqual(
        Long userId, LocalDate date);
    
    /**
     * Get flashcards due on a specific date
     */
    List<FlashcardReview> findByUserIdAndNextReviewDate(Long userId, LocalDate date);
    
    /**
     * Get overdue flashcards
     */
    List<FlashcardReview> findByUserIdAndNextReviewDateBefore(Long userId, LocalDate date);
    
    /**
     * Get recent reviews for a user (for stats)
     */
    List<FlashcardReview> findByUserIdOrderByReviewDateDesc(Long userId);
    
    /**
     * Count user's total cards
     */
    long countByUserId(Long userId);
    
    /**
     * Count cards due on specific date
     */
    long countByUserIdAndNextReviewDate(Long userId, LocalDate date);
    
    /**
     * Count overdue cards
     */
    long countByUserIdAndNextReviewDateBefore(Long userId, LocalDate date);
    
    /**
     * Get all reviews for a specific flashcard
     */
    List<FlashcardReview> findByFlashcardIdOrderByReviewDateDesc(UUID flashcardId);
    
    /**
     * Delete all reviews for a flashcard
     */
    void deleteByFlashcardId(UUID flashcardId);
}
