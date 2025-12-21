package com.muse.social.reputation.service;

import com.muse.social.reputation.entity.UserReputation;
import com.muse.social.reputation.entity.ReputationHistory;
import com.muse.social.reputation.repository.UserReputationRepository;
import com.muse.social.reputation.repository.ReputationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reputation Service for gamification and points management.
 * 
 * Level Calculation (matches DB function):
 * - Level 1: 0-99 points
 * - Level 2: 100-299 points
 * - Level 3: 300-599 points
 * - Level 4: 600-999 points
 * - Level 5: 1000-1499 points
 * - Level 6: 1500-2099 points
 * - Level 7: 2100-2799 points
 * - Level 8: 2800-3599 points
 * - Level 9: 3600-4499 points
 * - Level 10: 4500+ points
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReputationService {

    private final UserReputationRepository reputationRepo;
    private final ReputationHistoryRepository historyRepo;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_KEY_PREFIX = "reputation:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    // Level thresholds (same as calculate_level DB function)
    private static final int[] LEVEL_THRESHOLDS = {
            0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500
    };

    /**
     * Calculate level from score (1-10).
     * Matches the PostgreSQL calculate_level() function.
     */
    public int calculateLevel(int score) {
        if (score < 100)
            return 1;
        if (score < 300)
            return 2;
        if (score < 600)
            return 3;
        if (score < 1000)
            return 4;
        if (score < 1500)
            return 5;
        if (score < 2100)
            return 6;
        if (score < 2800)
            return 7;
        if (score < 3600)
            return 8;
        if (score < 4500)
            return 9;
        return 10;
    }

    /**
     * Get points needed for next level.
     */
    public int getPointsToNextLevel(int currentScore) {
        int currentLevel = calculateLevel(currentScore);
        if (currentLevel >= 10)
            return 0;
        return LEVEL_THRESHOLDS[currentLevel] - currentScore;
    }

    /**
     * Get or create user reputation profile.
     * Uses Redis cache for fast lookups.
     */
    public UserReputation getOrCreateReputation(Long userId) {
        String cacheKey = REDIS_KEY_PREFIX + userId;

        // Try cache first
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof UserReputation) {
            return (UserReputation) cached;
        }

        // Load from DB or create new
        UserReputation rep = reputationRepo.findByUserId(userId)
                .orElseGet(() -> {
                    UserReputation newRep = UserReputation.builder()
                            .userId(userId)
                            .totalScore(0)
                            .level(1)
                            .build();
                    return reputationRepo.save(newRep);
                });

        // Cache result
        redisTemplate.opsForValue().set(cacheKey, rep, CACHE_TTL);

        return rep;
    }

    /**
     * Add points to user's reputation and auto-update level.
     * 
     * @param userId     User ID from Auth Service
     * @param points     Points to add (can be negative)
     * @param reason     Human-readable reason
     * @param sourceType Category: bounty | post | upvote | streak | admin
     * @param sourceId   Related entity ID (optional)
     */
    @Transactional
    public UserReputation addPoints(Long userId, int points, String reason,
            String sourceType, Long sourceId) {
        UserReputation rep = getOrCreateReputation(userId);

        int oldScore = rep.getTotalScore();
        int oldLevel = rep.getLevel();

        // Update score
        int newScore = Math.max(0, oldScore + points); // Prevent negative reputation
        rep.setTotalScore(newScore);

        // Recalculate level
        int newLevel = calculateLevel(newScore);
        rep.setLevel(newLevel);

        // Update activity date
        rep.setLastActivityDate(LocalDateTime.now());

        // Update streak
        updateStreak(rep);

        // Save to DB
        rep = reputationRepo.save(rep);

        // Record history
        ReputationHistory history = ReputationHistory.builder()
                .userId(userId)
                .pointsChange(points)
                .reason(reason)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .build();
        historyRepo.save(history);

        // Invalidate cache
        invalidateCache(userId);

        // Log level change
        if (newLevel != oldLevel) {
            log.info("User {} leveled {} from {} to {} (score: {})",
                    userId, newLevel > oldLevel ? "UP" : "DOWN",
                    oldLevel, newLevel, newScore);
        }

        return rep;
    }

    /**
     * Convenience method without source tracking.
     */
    @Transactional
    public void addPoints(Long userId, int points, String reason) {
        addPoints(userId, points, reason, null, null);
    }

    /**
     * Check if user has minimum points.
     * 
     * @throws InsufficientReputationException if not enough points
     */
    public void requireMinimumPoints(Long userId, int minPoints) {
        UserReputation rep = getOrCreateReputation(userId);

        if (rep.getTotalScore() < minPoints) {
            throw new InsufficientReputationException(
                    String.format("You need at least %d reputation points. Current: %d",
                            minPoints, rep.getTotalScore()));
        }
    }

    /**
     * Increment bounties created count.
     */
    @Transactional
    public void incrementBountiesCreated(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);
        rep.setBountiesCreated(rep.getBountiesCreated() + 1);
        reputationRepo.save(rep);
        invalidateCache(userId);
    }

    /**
     * Increment bounties solved count.
     */
    @Transactional
    public void incrementBountiesSolved(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);
        rep.setBountiesSolved(rep.getBountiesSolved() + 1);
        reputationRepo.save(rep);
        invalidateCache(userId);
    }

    /**
     * Increment notes shared count.
     */
    @Transactional
    public void incrementNotesShared(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);
        rep.setNotesShared(rep.getNotesShared() + 1);
        reputationRepo.save(rep);
        invalidateCache(userId);
    }

    /**
     * Record upvote given/received.
     */
    @Transactional
    public void recordUpvote(Long giverId, Long receiverId) {
        // Receiver gets points
        addPoints(receiverId, 2, "Received upvote", "upvote", giverId);

        // Update receiver's count
        UserReputation receiver = getOrCreateReputation(receiverId);
        receiver.setUpvotesReceived(receiver.getUpvotesReceived() + 1);
        reputationRepo.save(receiver);

        // Update giver's count
        UserReputation giver = getOrCreateReputation(giverId);
        giver.setUpvotesGiven(giver.getUpvotesGiven() + 1);
        reputationRepo.save(giver);

        invalidateCache(receiverId);
        invalidateCache(giverId);
    }

    /**
     * Get user's reputation summary for dashboard.
     */
    public Map<String, Object> getReputationSummary(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);

        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", userId);
        summary.put("totalScore", rep.getTotalScore());
        summary.put("level", rep.getLevel());
        summary.put("pointsToNextLevel", getPointsToNextLevel(rep.getTotalScore()));
        summary.put("streakDays", rep.getStreakDays());
        summary.put("longestStreak", rep.getLongestStreak());
        summary.put("bountiesCreated", rep.getBountiesCreated());
        summary.put("bountiesSolved", rep.getBountiesSolved());
        summary.put("notesShared", rep.getNotesShared());
        summary.put("upvotesReceived", rep.getUpvotesReceived());
        summary.put("upvotesGiven", rep.getUpvotesGiven());
        summary.put("lastActivityDate", rep.getLastActivityDate());

        // Level progress percentage
        int levelStart = rep.getLevel() > 1 ? LEVEL_THRESHOLDS[rep.getLevel() - 1] : 0;
        int levelEnd = rep.getLevel() < 10 ? LEVEL_THRESHOLDS[rep.getLevel()] : rep.getTotalScore();
        int progress = levelEnd > levelStart
                ? (int) ((rep.getTotalScore() - levelStart) * 100.0 / (levelEnd - levelStart))
                : 100;
        summary.put("levelProgress", Math.min(100, progress));

        return summary;
    }

    /**
     * Get recent reputation history.
     */
    public List<ReputationHistory> getRecentHistory(Long userId, int limit) {
        return historyRepo.findByUserIdOrderByCreatedAtDesc(userId,
                org.springframework.data.domain.PageRequest.of(0, limit));
    }

    /**
     * Get leaderboard.
     */
    public List<UserReputation> getLeaderboard(int limit) {
        return reputationRepo.findTopUsers(
                org.springframework.data.domain.PageRequest.of(0, limit));
    }

    /**
     * Update daily streak.
     */
    private void updateStreak(UserReputation rep) {
        LocalDate today = LocalDate.now();
        LocalDate lastActive = rep.getLastActivityDate() != null
                ? rep.getLastActivityDate().toLocalDate()
                : null;

        if (lastActive == null) {
            // First activity
            rep.setStreakDays(1);
        } else if (lastActive.equals(today.minusDays(1))) {
            // Consecutive day - increment streak
            rep.setStreakDays(rep.getStreakDays() + 1);

            // Update longest streak
            if (rep.getStreakDays() > rep.getLongestStreak()) {
                rep.setLongestStreak(rep.getStreakDays());
            }

            // Award streak bonus points
            if (rep.getStreakDays() % 7 == 0) {
                // Weekly streak bonus (handled separately to avoid recursion)
                log.info("User {} achieved {} day streak!", rep.getUserId(), rep.getStreakDays());
            }
        } else if (!lastActive.equals(today)) {
            // Streak broken
            rep.setStreakDays(1);
        }
        // If same day, don't change streak
    }

    /**
     * Invalidate Redis cache for user.
     */
    private void invalidateCache(Long userId) {
        String cacheKey = REDIS_KEY_PREFIX + userId;
        redisTemplate.delete(cacheKey);
    }

    // Exception class
    public static class InsufficientReputationException extends RuntimeException {
        public InsufficientReputationException(String message) {
            super(message);
        }
    }
}
