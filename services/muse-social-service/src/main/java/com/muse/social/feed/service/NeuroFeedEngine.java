package com.muse.social.feed.service;

import com.muse.social.feed.entity.*;
import com.muse.social.feed.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * NeuroFeed Algorithm - Custom education-optimized recommendation engine
 * 
 * Features:
 * - Learning Velocity Tracker (LVT)
 * - Attention Depth Score (ADS)
 * - Cognitive Load Balancer (CLB)
 * - Interest DNA tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NeuroFeedEngine {

    private final PostRepository postRepository;
    private final UserInterestDNARepository interestDNARepository;
    private final UserFollowRepository followRepository;
    private final SavedPostRepository savedPostRepository;
    private final EngagementEventRepository engagementEventRepository;

    // Algorithm weights
    private static final double RELEVANCE_WEIGHT = 0.30;
    private static final double QUALITY_WEIGHT = 0.25;
    private static final double LEVEL_MATCH_WEIGHT = 0.20;
    private static final double FRESHNESS_WEIGHT = 0.15;
    private static final double COGNITIVE_WEIGHT = 0.10;

    // Feed composition percentages
    private static final double INTEREST_RATIO = 0.50;
    private static final double TRENDING_RATIO = 0.25;
    private static final double FOLLOWING_RATIO = 0.15;
    private static final double DISCOVERY_RATIO = 0.10;

    /**
     * Generate personalized feed for user
     */
    public List<Post> generateFeed(String userId, int limit, int offset) {
        log.info("Generating NeuroFeed for user: {}", userId);

        // 1. Get user's Interest DNA
        List<UserInterestDNA> userDNA = interestDNARepository.findTopInterestsByUserId(userId);
        Set<String> preferredHashtags = userDNA.stream()
                .map(UserInterestDNA::getHashtag)
                .collect(Collectors.toSet());

        // 2. Detect session mode (could be enhanced with real session tracking)
        SessionMode mode = detectSessionMode(userId);

        // 3. Calculate cognitive load balanced composition
        int interestCount = (int) (limit * INTEREST_RATIO);
        int trendingCount = (int) (limit * TRENDING_RATIO);
        int followingCount = (int) (limit * FOLLOWING_RATIO);
        int discoveryCount = limit - interestCount - trendingCount - followingCount;

        // 4. Fetch posts from each source
        List<Post> feed = new ArrayList<>();

        // Interest-based posts (50%)
        if (!preferredHashtags.isEmpty()) {
            feed.addAll(fetchByHashtags(preferredHashtags, interestCount));
        }

        // Trending posts (25%)
        feed.addAll(fetchTrendingPosts(trendingCount));

        // Following posts (15%)
        List<String> followingIds = followRepository.findFollowingIds(userId);
        if (!followingIds.isEmpty()) {
            feed.addAll(fetchFromFollowing(followingIds, followingCount));
        }

        // Discovery posts (10%)
        feed.addAll(fetchDiscoveryPosts(preferredHashtags, discoveryCount));

        // 5. Rank by NeuroFeed score
        List<ScoredPost> scoredPosts = feed.stream()
                .distinct()
                .map(post -> new ScoredPost(post, calculateNeuroScore(post, userDNA, mode)))
                .sorted(Comparator.comparingDouble(ScoredPost::score).reversed())
                .skip(offset)
                .limit(limit)
                .toList();

        return scoredPosts.stream().map(ScoredPost::post).toList();
    }

    /**
     * THE CORE FORMULA - Calculate NeuroFeed score
     */
    private double calculateNeuroScore(Post post, List<UserInterestDNA> userDNA, SessionMode mode) {
        double relevance = calculateRelevance(post, userDNA);
        double quality = calculateQuality(post);
        double levelMatch = calculateLevelMatch(post, userDNA);
        double freshness = calculateFreshness(post);
        double cognitiveBonus = calculateCognitiveBonus(post, mode);

        return (relevance * RELEVANCE_WEIGHT) +
                (quality * QUALITY_WEIGHT) +
                (levelMatch * LEVEL_MATCH_WEIGHT) +
                (freshness * FRESHNESS_WEIGHT) +
                (cognitiveBonus * COGNITIVE_WEIGHT);
    }

    /**
     * Relevance: How well does post match user interests?
     */
    private double calculateRelevance(Post post, List<UserInterestDNA> userDNA) {
        if (post.getHashtags() == null || post.getHashtags().isEmpty()) {
            return 0.3; // Baseline for posts without hashtags
        }

        Set<String> postTags = new HashSet<>(post.getHashtags());
        double totalScore = 0;
        double maxPossible = 0;

        for (UserInterestDNA interest : userDNA) {
            maxPossible += interest.getInterestScore();
            if (postTags.contains(interest.getHashtag())) {
                // Apply momentum boost for trending interests
                totalScore += interest.getInterestScore() * interest.getMomentum();
            }
        }

        return maxPossible > 0 ? Math.min(totalScore / maxPossible, 1.0) : 0.3;
    }

    /**
     * Quality: Engagement signals
     */
    private double calculateQuality(Post post) {
        // Log-scaled engagement score
        double engagement = Math.log10(
                post.getLikeCount() +
                        (post.getSaveCount() != null ? post.getSaveCount() * 2 : 0) +
                        (post.getCommentCount() != null ? post.getCommentCount() * 3 : 0) +
                        1);
        return Math.min(engagement / 5.0, 1.0);
    }

    /**
     * Level Match: Right difficulty for user's learning level
     */
    private double calculateLevelMatch(Post post, List<UserInterestDNA> userDNA) {
        if (post.getDifficultyLevel() == null) {
            return 0.5; // Neutral for unclassified posts
        }

        // Find user's level in post's topics
        for (UserInterestDNA interest : userDNA) {
            if (post.getHashtags() != null && post.getHashtags().contains(interest.getHashtag())) {
                String userLevel = interest.getCurrentLevel().name();
                String postDifficulty = post.getDifficultyLevel().name();

                // Perfect match
                if (isLevelMatch(userLevel, postDifficulty))
                    return 1.0;

                // One level above (growth zone) - good
                if (isOneLevelAbove(userLevel, postDifficulty))
                    return 0.8;

                // One level below (review) - okay
                if (isOneLevelBelow(userLevel, postDifficulty))
                    return 0.6;

                // Too advanced or too basic
                return 0.4;
            }
        }

        return 0.5; // No match found
    }

    /**
     * Freshness: Exponential decay based on age
     */
    private double calculateFreshness(Post post) {
        long hoursOld = ChronoUnit.HOURS.between(post.getCreatedAt(), Instant.now());
        // Decay factor: ~0.95 after 1 hour, ~0.6 after 10 hours, ~0.13 after 40 hours
        return Math.exp(-0.05 * hoursOld);
    }

    /**
     * Cognitive Bonus: Balance content types for optimal learning
     */
    private double calculateCognitiveBonus(Post post, SessionMode mode) {
        if (post.getContentType() == null)
            return 0.5;

        return switch (mode) {
            case BROWSING -> {
                // Prefer quick, visual content
                yield switch (post.getContentType()) {
                    case INSIGHT -> 0.9;
                    case DISCUSSION -> 0.8;
                    case QUESTION -> 0.7;
                    case RESOURCE -> 0.5;
                    case ANNOUNCEMENT -> 0.6;
                };
            }
            case LEARNING -> {
                // Prefer detailed, educational content
                yield switch (post.getContentType()) {
                    case RESOURCE -> 0.9;
                    case INSIGHT -> 0.8;
                    case QUESTION -> 0.7;
                    case DISCUSSION -> 0.6;
                    case ANNOUNCEMENT -> 0.5;
                };
            }
            case DEEP_FOCUS -> {
                // Prefer challenging content
                yield switch (post.getContentType()) {
                    case QUESTION -> 0.9;
                    case RESOURCE -> 0.8;
                    case INSIGHT -> 0.7;
                    case DISCUSSION -> 0.5;
                    case ANNOUNCEMENT -> 0.4;
                };
            }
        };
    }

    // ==================== Helper Methods ====================

    private List<Post> fetchByHashtags(Set<String> hashtags, int limit) {
        // This would be a custom query in PostRepository
        return postRepository.findAll().stream()
                .filter(p -> p.getHashtags() != null && !Collections.disjoint(p.getHashtags(), hashtags))
                .limit(limit)
                .toList();
    }

    private List<Post> fetchTrendingPosts(int limit) {
        return postRepository.findAll().stream()
                .sorted(Comparator.comparing(Post::getTrendingScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .toList();
    }

    private List<Post> fetchFromFollowing(List<String> followingIds, int limit) {
        return postRepository.findAll().stream()
                .filter(p -> followingIds.contains(String.valueOf(p.getUserId())))
                .limit(limit)
                .toList();
    }

    private List<Post> fetchDiscoveryPosts(Set<String> excludeHashtags, int limit) {
        return postRepository.findAll().stream()
                .filter(p -> p.getHashtags() == null || Collections.disjoint(p.getHashtags(), excludeHashtags))
                .sorted(Comparator.comparing(Post::getQualityScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .toList();
    }

    private SessionMode detectSessionMode(String userId) {
        // Simplified detection - could be enhanced with real session data
        return SessionMode.BROWSING;
    }

    private boolean isLevelMatch(String userLevel, String postDifficulty) {
        return userLevel.equalsIgnoreCase(postDifficulty) ||
                (userLevel.equals("BEGINNER") && postDifficulty.equals("EASY")) ||
                (userLevel.equals("INTERMEDIATE") && postDifficulty.equals("MEDIUM")) ||
                (userLevel.equals("ADVANCED") && postDifficulty.equals("HARD"));
    }

    private boolean isOneLevelAbove(String userLevel, String postDifficulty) {
        return (userLevel.equals("BEGINNER") && postDifficulty.equals("MEDIUM")) ||
                (userLevel.equals("INTERMEDIATE") && postDifficulty.equals("HARD"));
    }

    private boolean isOneLevelBelow(String userLevel, String postDifficulty) {
        return (userLevel.equals("INTERMEDIATE") && postDifficulty.equals("EASY")) ||
                (userLevel.equals("ADVANCED") && postDifficulty.equals("MEDIUM"));
    }

    // ==================== Inner Types ====================

    public enum SessionMode {
        BROWSING, // Quick scrolling
        LEARNING, // Focused study
        DEEP_FOCUS // Research mode
    }

    private record ScoredPost(Post post, double score) {
    }
}
