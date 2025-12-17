package com.muse.ai.service;

import com.muse.ai.entity.FlashcardReview;
import com.muse.ai.repository.FlashcardReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * FSRS (Free Spaced Repetition Scheduler) Service
 * Implements FSRS-5 algorithm for optimal study scheduling
 * 
 * Based on research paper: https://github.com/open-spaced-repetition/fsrs4anki
 * 
 * Key concepts:
 * - Stability (S): How long you'll remember (days until 90% recall)
 * - Difficulty (D): How hard the card is (1-10 scale)
 * - Retrievability (R): Current probability of recall
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FSRSService {

    private final FlashcardReviewRepository reviewRepository;

    // FSRS-5 default parameters (research-optimized)
    private static final double[] PARAMS = {
            0.40255, 1.18385, 3.173, 15.69, // w0-w3: Initial stability
            7.1949, 0.5345, 1.4604, 0.0046, // w4-w7: Difficulty
            1.54575, 0.1192, 1.01925, 1.9395, // w8-w11: Stability after success
            0.11, 0.29605, 2.2698, 0.2315, // w12-w15: Stability after failure
            2.9898, 0.51655, 0.6621 // w16-w18: Short-term stability
    };

    // Target retrievability (90% recall probability)
    private static final double TARGET_RETENTION = 0.90;

    // Rating values
    public static final int RATING_AGAIN = 1; // Complete blackout
    public static final int RATING_HARD = 2; // Struggled but got it
    public static final int RATING_GOOD = 3; // Correct with effort
    public static final int RATING_EASY = 4; // Instant recall

    /**
     * Process a flashcard review and calculate next review date
     */
    @Transactional
    public ReviewResult processReview(UUID flashcardId, Long userId, int rating) {
        Optional<FlashcardReview> lastReviewOpt = reviewRepository
                .findTopByFlashcardIdAndUserIdOrderByReviewDateDesc(flashcardId, userId);

        FlashcardReview newReview;

        if (lastReviewOpt.isEmpty()) {
            // First review - initialize card state
            newReview = initializeCard(flashcardId, userId, rating);
        } else {
            // Subsequent review - update state
            FlashcardReview lastReview = lastReviewOpt.get();
            newReview = updateCard(lastReview, rating);
        }

        reviewRepository.save(newReview);

        log.info("FSRS: Card {} rated {}, next review in {} days",
                flashcardId, rating, newReview.getInterval());

        return new ReviewResult(
                newReview.getNextReviewDate(),
                newReview.getInterval(),
                newReview.getStability(),
                newReview.getDifficulty());
    }

    /**
     * Get all flashcards due for review
     */
    public List<DueCard> getDueCards(Long userId) {
        LocalDate today = LocalDate.now();
        List<FlashcardReview> dueReviews = reviewRepository.findByUserIdAndNextReviewDateLessThanEqual(userId, today);

        // Sort by urgency (overdue first, then by retrievability)
        return dueReviews.stream()
                .map(r -> new DueCard(
                        r.getFlashcardId(),
                        r.getNextReviewDate(),
                        calculateRetrievability(r),
                        calculateUrgency(r)))
                .sorted(Comparator.comparing(DueCard::getUrgency).reversed())
                .toList();
    }

    /**
     * Get study statistics for a user
     */
    public StudyStats getStats(Long userId) {
        LocalDate today = LocalDate.now();

        long totalCards = reviewRepository.countByUserId(userId);
        long dueToday = reviewRepository.countByUserIdAndNextReviewDate(userId, today);
        long overdue = reviewRepository.countByUserIdAndNextReviewDateBefore(userId, today);

        // Calculate average retention
        List<FlashcardReview> recentReviews = reviewRepository.findByUserIdOrderByReviewDateDesc(userId);
        double avgRetention = recentReviews.stream()
                .limit(100)
                .mapToDouble(this::calculateRetrievability)
                .average()
                .orElse(0.0);

        return new StudyStats(totalCards, dueToday, overdue, avgRetention);
    }

    // ============== FSRS Algorithm Implementation ==============

    /**
     * Initialize a new card after first review
     */
    private FlashcardReview initializeCard(UUID flashcardId, Long userId, int rating) {
        // Initial stability based on rating
        double stability = calculateInitialStability(rating);

        // Initial difficulty (starts neutral, adjusts with reviews)
        double difficulty = calculateInitialDifficulty(rating);

        // Calculate interval from stability
        int interval = calculateInterval(stability);

        return FlashcardReview.builder()
                .flashcardId(flashcardId)
                .userId(userId)
                .rating(rating)
                .reviewDate(LocalDate.now())
                .nextReviewDate(LocalDate.now().plusDays(interval))
                .interval(interval)
                .stability(stability)
                .difficulty(difficulty)
                .reps(1)
                .lapses(rating == RATING_AGAIN ? 1 : 0)
                .build();
    }

    /**
     * Update card state after subsequent review
     */
    private FlashcardReview updateCard(FlashcardReview lastReview, int rating) {
        double oldStability = lastReview.getStability();
        double oldDifficulty = lastReview.getDifficulty();
        int reps = lastReview.getReps();
        int lapses = lastReview.getLapses();

        // Calculate days since last review
        long daysSinceReview = ChronoUnit.DAYS.between(
                lastReview.getReviewDate(), LocalDate.now());

        // Calculate retrievability at time of review
        double retrievability = calculateRetrievabilityAtTime(oldStability, daysSinceReview);

        // Update difficulty
        double newDifficulty = updateDifficulty(oldDifficulty, rating);

        // Update stability based on rating
        double newStability;
        int newLapses = lapses;

        if (rating == RATING_AGAIN) {
            // Forgot - decrease stability, increase lapses
            newStability = calculateStabilityAfterFailure(oldStability, newDifficulty, retrievability);
            newLapses++;
        } else {
            // Remembered - increase stability
            newStability = calculateStabilityAfterSuccess(
                    oldStability, newDifficulty, retrievability, rating);
        }

        int interval = calculateInterval(newStability);

        return FlashcardReview.builder()
                .flashcardId(lastReview.getFlashcardId())
                .userId(lastReview.getUserId())
                .rating(rating)
                .reviewDate(LocalDate.now())
                .nextReviewDate(LocalDate.now().plusDays(interval))
                .interval(interval)
                .stability(newStability)
                .difficulty(newDifficulty)
                .reps(reps + 1)
                .lapses(newLapses)
                .build();
    }

    /**
     * Calculate initial stability (S0) based on first rating
     * S0(G) = w[G-1] where G is rating 1-4
     */
    private double calculateInitialStability(int rating) {
        return PARAMS[rating - 1];
    }

    /**
     * Calculate initial difficulty
     * D0 = w4 - exp(w5 * (G - 1)) + 1
     */
    private double calculateInitialDifficulty(int rating) {
        double d = PARAMS[4] - Math.exp(PARAMS[5] * (rating - 1)) + 1;
        return Math.max(1, Math.min(10, d)); // Clamp to 1-10
    }

    /**
     * Update difficulty based on rating
     * D' = w6 * D0(4) + (1 - w6) * (D - w7 * (G - 3))
     */
    private double updateDifficulty(double oldDifficulty, int rating) {
        double d0G4 = calculateInitialDifficulty(4); // D0 for "Easy" rating
        double delta = PARAMS[7] * (rating - 3);
        double newD = PARAMS[6] * d0G4 + (1 - PARAMS[6]) * (oldDifficulty - delta);
        return Math.max(1, Math.min(10, newD));
    }

    /**
     * Calculate stability after successful recall
     * S' = S * (e^w8 * (11-D) * S^(-w9) * (e^(w10*(1-R)) - 1) * w15 + 1)
     */
    private double calculateStabilityAfterSuccess(
            double stability, double difficulty, double retrievability, int rating) {

        // Hard/Good/Easy multipliers
        double hardPenalty = (rating == RATING_HARD) ? PARAMS[15] : 1;
        double easyBonus = (rating == RATING_EASY) ? PARAMS[16] : 1;

        double factor = Math.exp(PARAMS[8]) *
                (11 - difficulty) *
                Math.pow(stability, -PARAMS[9]) *
                (Math.exp(PARAMS[10] * (1 - retrievability)) - 1) *
                hardPenalty * easyBonus + 1;

        return stability * factor;
    }

    /**
     * Calculate stability after failed recall (lapse)
     * S' = w11 * D^(-w12) * ((S+1)^w13 - 1) * e^(w14*(1-R))
     */
    private double calculateStabilityAfterFailure(
            double stability, double difficulty, double retrievability) {

        double newS = PARAMS[11] *
                Math.pow(difficulty, -PARAMS[12]) *
                (Math.pow(stability + 1, PARAMS[13]) - 1) *
                Math.exp(PARAMS[14] * (1 - retrievability));

        return Math.max(0.1, Math.min(newS, stability)); // Don't increase on failure
    }

    /**
     * Calculate retrievability at a given time
     * R = (1 + t/S * FACTOR)^DECAY
     */
    private double calculateRetrievabilityAtTime(double stability, long days) {
        double factor = 19.0 / 81.0; // FSRS constant
        double decay = -0.5; // FSRS constant
        return Math.pow(1 + (days / stability) * factor, decay);
    }

    /**
     * Calculate current retrievability for a review
     */
    private double calculateRetrievability(FlashcardReview review) {
        long days = ChronoUnit.DAYS.between(review.getReviewDate(), LocalDate.now());
        return calculateRetrievabilityAtTime(review.getStability(), days);
    }

    /**
     * Calculate urgency score for sorting due cards
     */
    private double calculateUrgency(FlashcardReview review) {
        long daysOverdue = ChronoUnit.DAYS.between(review.getNextReviewDate(), LocalDate.now());
        double retrievability = calculateRetrievability(review);

        // Higher urgency for:
        // - More overdue cards
        // - Lower retrievability
        return daysOverdue + (1 - retrievability) * 10;
    }

    /**
     * Calculate interval in days from stability
     * I = S * log(R) / log(0.9) where R = target retention
     */
    private int calculateInterval(double stability) {
        double interval = stability * Math.log(TARGET_RETENTION) / Math.log(0.9);
        return Math.max(1, (int) Math.round(interval));
    }

    // ============== Data Classes ==============

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ReviewResult {
        private LocalDate nextReviewDate;
        private int intervalDays;
        private double stability;
        private double difficulty;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class DueCard {
        private UUID flashcardId;
        private LocalDate dueDate;
        private double retrievability;
        private double urgency;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class StudyStats {
        private long totalCards;
        private long dueToday;
        private long overdue;
        private double averageRetention;
    }
}
