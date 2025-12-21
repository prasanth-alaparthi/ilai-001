package com.muse.social.domain.reputation.service;

import com.muse.social.domain.reputation.entity.UserReputation;
import com.muse.social.domain.reputation.repository.UserReputationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ReputationService - DDD Domain Service.
 * 
 * Location: domain/reputation/service
 * 
 * Handles:
 * - Point management (add/deduct)
 * - Level calculation (1-10)
 * - Streak tracking
 * - Leaderboard queries
 * 
 * Level Thresholds:
 * 1: 0-99, 2: 100-299, 3: 300-599, 4: 600-999, 5: 1000-1499
 * 6: 1500-2099, 7: 2100-2799, 8: 2800-3599, 9: 3600-4499, 10: 4500+
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReputationService {

    private final UserReputationRepository reputationRepo;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "reputation:";

    /**
     * Calculate level from score (matches PostgreSQL function).
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
     * Get or create user reputation.
     */
    public UserReputation getOrCreateReputation(Long userId) {
        return reputationRepo.findByUserId(userId)
                .orElseGet(() -> {
                    UserReputation rep = UserReputation.builder()
                            .userId(userId)
                            .totalScore(0)
                            .level(1)
                            .build();
                    return reputationRepo.save(rep);
                });
    }

    /**
     * Add points and recalculate level.
     */
    @Transactional
    public UserReputation addPoints(Long userId, int points, String reason,
            String sourceType, Long sourceId) {
        UserReputation rep = getOrCreateReputation(userId);

        int oldLevel = rep.getLevel();
        rep.addPoints(points);
        rep.setLevel(calculateLevel(rep.getTotalScore()));
        rep.setLastActivityDate(LocalDateTime.now());

        updateStreak(rep);
        rep = reputationRepo.save(rep);

        // Invalidate cache
        redisTemplate.delete(CACHE_PREFIX + userId);

        if (rep.getLevel() != oldLevel) {
            log.info("User {} level changed: {} → {} (score: {})",
                    userId, oldLevel, rep.getLevel(), rep.getTotalScore());
        }

        return rep;
    }

    /**
     * Check minimum points requirement.
     */
    public void requireMinimumPoints(Long userId, int minPoints) {
        UserReputation rep = getOrCreateReputation(userId);
        if (rep.getTotalScore() < minPoints) {
            throw new InsufficientReputationException(
                    "Need " + minPoints + " points. Current: " + rep.getTotalScore());
        }
    }

    @Transactional
    public void incrementBountiesCreated(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);
        rep.setBountiesCreated(rep.getBountiesCreated() + 1);
        reputationRepo.save(rep);
    }

    @Transactional
    public void incrementBountiesSolved(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);
        rep.setBountiesSolved(rep.getBountiesSolved() + 1);
        reputationRepo.save(rep);
    }

    @Transactional
    public void decrementBountiesSolved(Long userId) {
        UserReputation rep = getOrCreateReputation(userId);
        int current = rep.getBountiesSolved();
        rep.setBountiesSolved(Math.max(0, current - 1));
        reputationRepo.save(rep);
    }

    public List<UserReputation> getLeaderboard(int limit) {
        return reputationRepo.findTopUsers(PageRequest.of(0, limit));
    }

    private void updateStreak(UserReputation rep) {
        LocalDate today = LocalDate.now();
        LocalDate lastActive = rep.getLastActivityDate() != null
                ? rep.getLastActivityDate().toLocalDate()
                : null;

        if (lastActive == null) {
            rep.setStreakDays(1);
        } else if (lastActive.equals(today.minusDays(1))) {
            rep.setStreakDays(rep.getStreakDays() + 1);
            if (rep.getStreakDays() > rep.getLongestStreak()) {
                rep.setLongestStreak(rep.getStreakDays());
            }
        } else if (!lastActive.equals(today)) {
            rep.setStreakDays(1);
        }
    }

    public static class InsufficientReputationException extends RuntimeException {
        public InsufficientReputationException(String msg) {
            super(msg);
        }
    }
}
