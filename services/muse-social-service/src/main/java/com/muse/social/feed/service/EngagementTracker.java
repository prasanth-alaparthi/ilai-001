package com.muse.social.feed.service;

import com.muse.social.feed.entity.*;
import com.muse.social.feed.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Tracks user engagement and updates Interest DNA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EngagementTracker {

    private final EngagementEventRepository eventRepository;
    private final UserInterestDNARepository interestDNARepository;
    private final PostRepository postRepository;

    // Points for different actions
    private static final double VIEW_POINTS = 1.0;
    private static final double LIKE_POINTS = 5.0;
    private static final double COMMENT_POINTS = 10.0;
    private static final double SAVE_POINTS = 15.0;
    private static final double SHARE_POINTS = 20.0;
    private static final double ANSWER_CORRECT_POINTS = 25.0;

    // Decay factor for old interests
    private static final double INTEREST_DECAY = 0.98;

    /**
     * Track user engagement with a post
     */
    @Transactional
    public void trackEngagement(String userId, Long postId, EngagementEvent.EventType eventType,
            Integer timeSpentSeconds, Double scrollDepth) {
        // 1. Save raw engagement event
        EngagementEvent event = EngagementEvent.builder()
                .userId(userId)
                .postId(postId)
                .eventType(eventType)
                .timeSpentSeconds(timeSpentSeconds != null ? timeSpentSeconds : 0)
                .scrollDepth(scrollDepth != null ? scrollDepth : 0.0)
                .interactionDepth(getInteractionDepth(eventType))
                .build();
        eventRepository.save(event);
        log.debug("Tracked {} event for user {} on post {}", eventType, userId, postId);

        // 2. Get post for hashtag extraction
        postRepository.findById(postId).ifPresent(post -> {
            // 3. Calculate Attention Depth Score
            double adsScore = calculateADS(timeSpentSeconds, scrollDepth, eventType, post);

            // 4. Update user interests for each hashtag
            if (post.getHashtags() != null) {
                for (String hashtag : post.getHashtags()) {
                    updateInterestDNA(userId, hashtag, eventType, adsScore);
                }
            }

            // 5. Update post counters
            updatePostCounters(post, eventType);
        });
    }

    /**
     * Calculate Attention Depth Score (ADS)
     * Measures real engagement beyond just clicks
     */
    private double calculateADS(Integer timeSpent, Double scrollDepth,
            EngagementEvent.EventType eventType, Post post) {
        // Scroll depth score (0-1)
        double scrollScore = scrollDepth != null ? scrollDepth : 0.5;

        // Time ratio: actual / expected
        int expectedTime = post.getEstimatedReadSeconds() != null ? post.getEstimatedReadSeconds() : 60;
        double timeRatio = timeSpent != null ? Math.min((double) timeSpent / expectedTime, 2.0) / 2.0 : 0.3;

        // Interaction depth score
        double interactionScore = switch (eventType) {
            case VIEW -> 0.0;
            case CLICK, SCROLL -> 0.25;
            case LIKE, UNLIKE -> 0.5;
            case COMMENT -> 0.75;
            case SAVE, UNSAVE, SHARE, ANSWER_CORRECT, ANSWER_ATTEMPT -> 1.0;
        };

        // Weighted average
        return (scrollScore * 0.3) + (timeRatio * 0.4) + (interactionScore * 0.3);
    }

    /**
     * Update user's Interest DNA for a hashtag
     */
    private void updateInterestDNA(String userId, String hashtag,
            EngagementEvent.EventType eventType, double adsScore) {
        UserInterestDNA dna = interestDNARepository.findByUserIdAndHashtag(userId, hashtag)
                .orElseGet(() -> createNewInterestDNA(userId, hashtag));

        // Calculate points based on action type
        double basePoints = switch (eventType) {
            case VIEW -> VIEW_POINTS;
            case LIKE -> LIKE_POINTS;
            case COMMENT -> COMMENT_POINTS;
            case SAVE -> SAVE_POINTS;
            case SHARE -> SHARE_POINTS;
            case ANSWER_CORRECT -> ANSWER_CORRECT_POINTS;
            case ANSWER_ATTEMPT -> 5.0;
            case UNLIKE, UNSAVE -> -3.0; // Slight penalty for unlike/unsave
            default -> 0.0;
        };

        // Apply ADS multiplier
        double points = basePoints * (0.5 + adsScore); // 0.5-1.5x multiplier

        // Apply decay and add new points (max 100)
        double decayedScore = dna.getInterestScore() * INTEREST_DECAY;
        dna.setInterestScore(Math.min(decayedScore + points, 100.0));

        // Update engagement counts
        switch (eventType) {
            case VIEW -> dna.setTotalViews(dna.getTotalViews() + 1);
            case LIKE -> dna.setTotalLikes(dna.getTotalLikes() + 1);
            case SAVE -> dna.setTotalSaves(dna.getTotalSaves() + 1);
            case ANSWER_CORRECT -> dna.setCorrectAnswers(dna.getCorrectAnswers() + 1);
            default -> {
            }
        }

        // Update learning level based on correct answers
        updateLearningLevel(dna);

        // Update timestamps
        dna.setLastInteraction(Instant.now());

        interestDNARepository.save(dna);
        log.debug("Updated InterestDNA for user {} hashtag {}: score={}",
                userId, hashtag, dna.getInterestScore());
    }

    /**
     * Update post engagement counters
     */
    private void updatePostCounters(Post post, EngagementEvent.EventType eventType) {
        switch (eventType) {
            case VIEW -> post.setViewCount(post.getViewCount() + 1);
            case LIKE -> post.setLikeCount(post.getLikeCount() + 1);
            case UNLIKE -> post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            case COMMENT -> post.setCommentCount(post.getCommentCount() + 1);
            case SAVE -> post.setSaveCount(post.getSaveCount() + 1);
            case UNSAVE -> post.setSaveCount(Math.max(0, post.getSaveCount() - 1));
            case SHARE -> post.setShareCount(post.getShareCount() + 1);
            default -> {
            }
        }

        // Recalculate quality score
        double engagement = Math.log10(
                post.getLikeCount() +
                        post.getSaveCount() * 2 +
                        post.getCommentCount() * 3 +
                        1);
        post.setQualityScore(Math.min(engagement / 5.0, 1.0));

        postRepository.save(post);
    }

    /**
     * Update learning level based on performance
     */
    private void updateLearningLevel(UserInterestDNA dna) {
        int correctAnswers = dna.getCorrectAnswers();

        if (correctAnswers >= 50 && dna.getCurrentLevel() == UserInterestDNA.LearningLevel.INTERMEDIATE) {
            dna.setCurrentLevel(UserInterestDNA.LearningLevel.ADVANCED);
        } else if (correctAnswers >= 20 && dna.getCurrentLevel() == UserInterestDNA.LearningLevel.BEGINNER) {
            dna.setCurrentLevel(UserInterestDNA.LearningLevel.INTERMEDIATE);
        }
    }

    private UserInterestDNA createNewInterestDNA(String userId, String hashtag) {
        return UserInterestDNA.builder()
                .userId(userId)
                .hashtag(hashtag)
                .interestScore(0.0)
                .learningVelocity(0.0)
                .momentum(1.0)
                .totalViews(0)
                .totalLikes(0)
                .totalSaves(0)
                .totalTimeSeconds(0)
                .correctAnswers(0)
                .currentLevel(UserInterestDNA.LearningLevel.BEGINNER)
                .build();
    }

    private int getInteractionDepth(EngagementEvent.EventType eventType) {
        return switch (eventType) {
            case VIEW -> 0;
            case CLICK, SCROLL -> 1;
            case LIKE, UNLIKE -> 2;
            case COMMENT -> 3;
            case SAVE, UNSAVE, SHARE, ANSWER_ATTEMPT, ANSWER_CORRECT -> 4;
        };
    }
}
