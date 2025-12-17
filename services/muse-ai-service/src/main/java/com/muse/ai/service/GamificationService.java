package com.muse.ai.service;

import com.muse.ai.entity.*;
import com.muse.ai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gamification Service - Handles XP, levels, streaks, and achievements
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GamificationService {

    private final UserGamificationRepository gamificationRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final XpTransactionRepository xpTransactionRepository;

    // XP rewards for different actions
    public static final int XP_NOTE_CREATED = 10;
    public static final int XP_QUIZ_COMPLETED = 25;
    public static final int XP_QUIZ_PERFECT = 50;
    public static final int XP_FLASHCARD_REVIEWED = 2;
    public static final int XP_STUDY_MINUTE = 1;
    public static final int XP_DAILY_LOGIN = 5;
    public static final int XP_AI_USAGE = 3;

    // ============ XP Management ============

    /**
     * Award XP to a user for an action
     */
    @Transactional
    public Map<String, Object> awardXp(Long userId, String eventType, int xpAmount, String description,
            String referenceId) {
        UserGamification stats = getOrCreateStats(userId);

        // Add XP
        stats.setTotalXp(stats.getTotalXp() + xpAmount);

        // Check for level up
        boolean leveledUp = stats.updateLevel();
        int newLevel = stats.getLevel();

        // Log transaction
        XpTransaction transaction = XpTransaction.builder()
                .userId(userId)
                .eventType(eventType)
                .xpAmount(xpAmount)
                .description(description)
                .referenceId(referenceId)
                .build();
        xpTransactionRepository.save(transaction);

        // Update activity date for streak
        updateActivityDate(stats);

        gamificationRepository.save(stats);

        log.info("Awarded {} XP to user {} for {}", xpAmount, userId, eventType);

        Map<String, Object> result = new HashMap<>();
        result.put("xpAwarded", xpAmount);
        result.put("totalXp", stats.getTotalXp());
        result.put("level", stats.getLevel());
        result.put("leveledUp", leveledUp);

        // Check achievements after XP change
        List<Achievement> newAchievements = checkAndUnlockAchievements(userId, stats);
        if (!newAchievements.isEmpty()) {
            result.put("newAchievements", newAchievements);
        }

        return result;
    }

    /**
     * Award XP for common actions (convenience methods)
     */
    @Transactional
    public Map<String, Object> onNoteCreated(Long userId, String noteId) {
        UserGamification stats = getOrCreateStats(userId);
        stats.setNotesCreated(stats.getNotesCreated() + 1);
        gamificationRepository.save(stats);
        return awardXp(userId, XpTransaction.EVENT_NOTE_CREATED, XP_NOTE_CREATED, "Created a note", noteId);
    }

    @Transactional
    public Map<String, Object> onQuizCompleted(Long userId, String quizId, int score, int total) {
        UserGamification stats = getOrCreateStats(userId);
        stats.setQuizzesCompleted(stats.getQuizzesCompleted() + 1);
        gamificationRepository.save(stats);

        int xp = XP_QUIZ_COMPLETED;
        String desc = "Completed quiz with score " + score + "/" + total;

        // Bonus for perfect score
        if (score == total) {
            xp = XP_QUIZ_PERFECT;
            desc = "Perfect score on quiz!";
        }

        return awardXp(userId, XpTransaction.EVENT_QUIZ_COMPLETED, xp, desc, quizId);
    }

    @Transactional
    public Map<String, Object> onFlashcardsReviewed(Long userId, int count) {
        UserGamification stats = getOrCreateStats(userId);
        stats.setFlashcardsReviewed(stats.getFlashcardsReviewed() + count);
        gamificationRepository.save(stats);

        int xp = XP_FLASHCARD_REVIEWED * count;
        return awardXp(userId, XpTransaction.EVENT_FLASHCARD_REVIEWED, xp, "Reviewed " + count + " flashcards", null);
    }

    @Transactional
    public Map<String, Object> onStudySessionCompleted(Long userId, int durationMinutes) {
        UserGamification stats = getOrCreateStats(userId);
        stats.setTotalStudyMinutes(stats.getTotalStudyMinutes() + durationMinutes);
        gamificationRepository.save(stats);

        int xp = Math.min(XP_STUDY_MINUTE * durationMinutes, 100); // Cap at 100
        return awardXp(userId, XpTransaction.EVENT_STUDY_SESSION, xp, "Studied for " + durationMinutes + " minutes",
                null);
    }

    // ============ Streak Management ============

    /**
     * Update activity date and calculate streak
     */
    @Transactional
    public void updateActivityDate(UserGamification stats) {
        LocalDate today = LocalDate.now();
        LocalDate lastActivity = stats.getLastActivityDate();

        if (lastActivity == null) {
            // First activity ever
            stats.setCurrentStreak(1);
            stats.setLongestStreak(1);
        } else if (lastActivity.equals(today)) {
            // Already active today, no change
            return;
        } else if (lastActivity.equals(today.minusDays(1))) {
            // Consecutive day - extend streak
            stats.setCurrentStreak(stats.getCurrentStreak() + 1);
            if (stats.getCurrentStreak() > stats.getLongestStreak()) {
                stats.setLongestStreak(stats.getCurrentStreak());
            }

            // Streak bonus XP
            int streakBonus = calculateStreakBonus(stats.getCurrentStreak());
            if (streakBonus > 0) {
                awardXp(stats.getUserId(), XpTransaction.EVENT_STREAK_BONUS, streakBonus,
                        stats.getCurrentStreak() + " day streak bonus!", null);
            }
        } else {
            // Streak broken
            stats.setCurrentStreak(1);
        }

        stats.setLastActivityDate(today);
    }

    private int calculateStreakBonus(int streak) {
        if (streak >= 30)
            return 50;
        if (streak >= 14)
            return 25;
        if (streak >= 7)
            return 15;
        if (streak >= 3)
            return 5;
        return 0;
    }

    // ============ Achievement System ============

    /**
     * Check and unlock achievements based on current stats
     */
    @Transactional
    public List<Achievement> checkAndUnlockAchievements(Long userId, UserGamification stats) {
        List<Achievement> newAchievements = new ArrayList<>();
        Set<String> earnedCodes = new HashSet<>(userAchievementRepository.findAchievementCodesByUserId(userId));
        List<Achievement> allAchievements = achievementRepository.findAll();

        for (Achievement achievement : allAchievements) {
            if (earnedCodes.contains(achievement.getCode()))
                continue;

            boolean earned = checkAchievementCriteria(achievement, stats);
            if (earned) {
                unlockAchievement(userId, achievement);
                newAchievements.add(achievement);
            }
        }

        return newAchievements;
    }

    private boolean checkAchievementCriteria(Achievement achievement, UserGamification stats) {
        String type = achievement.getRequirementType();
        int required = achievement.getRequirementCount();

        return switch (achievement.getCategory()) {
            case "notes" -> stats.getNotesCreated() >= required;
            case "study" -> switch (achievement.getCode()) {
                case "flashcards_100", "flashcards_500", "flashcards_1000" -> stats.getFlashcardsReviewed() >= required;
                case "study_1hr", "study_10hr", "study_50hr", "study_100hr" -> stats.getTotalStudyMinutes() >= required;
                default -> stats.getQuizzesCompleted() >= required;
            };
            case "streak" -> "streak".equals(type) && stats.getCurrentStreak() >= required;
            case "special" -> switch (achievement.getCode()) {
                case "level_5" -> stats.getLevel() >= 5;
                case "level_10" -> stats.getLevel() >= 10;
                case "level_25" -> stats.getLevel() >= 25;
                case "level_50" -> stats.getLevel() >= 50;
                default -> false; // Special achievements handled elsewhere
            };
            default -> false;
        };
    }

    @Transactional
    public void unlockAchievement(Long userId, Achievement achievement) {
        if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievement.getId())) {
            return; // Already unlocked
        }

        UserAchievement userAchievement = UserAchievement.builder()
                .userId(userId)
                .achievement(achievement)
                .build();
        userAchievementRepository.save(userAchievement);

        // Award XP for achievement
        if (achievement.getXpReward() > 0) {
            awardXp(userId, XpTransaction.EVENT_ACHIEVEMENT, achievement.getXpReward(),
                    "Unlocked: " + achievement.getName(), achievement.getCode());
        }

        log.info("User {} unlocked achievement: {}", userId, achievement.getName());
    }

    // ============ Stats & Leaderboard ============

    /**
     * Get user's complete gamification stats
     */
    public Map<String, Object> getUserStats(Long userId) {
        UserGamification stats = getOrCreateStats(userId);
        List<UserAchievement> achievements = userAchievementRepository.findByUserIdOrderByEarnedAtDesc(userId);
        Long rank = gamificationRepository.findUserRankByXp(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("totalXp", stats.getTotalXp());
        result.put("level", stats.getLevel());
        result.put("progressToNextLevel", stats.getProgressToNextLevel());
        result.put("xpToNextLevel", UserGamification.xpForLevel(stats.getLevel() + 1) - stats.getTotalXp());
        result.put("currentStreak", stats.getCurrentStreak());
        result.put("longestStreak", stats.getLongestStreak());
        result.put("totalStudyMinutes", stats.getTotalStudyMinutes());
        result.put("notesCreated", stats.getNotesCreated());
        result.put("quizzesCompleted", stats.getQuizzesCompleted());
        result.put("flashcardsReviewed", stats.getFlashcardsReviewed());
        result.put("achievementCount", achievements.size());
        result.put("rank", rank);
        result.put("recentAchievements", achievements.stream()
                .limit(5)
                .map(ua -> Map.of(
                        "code", ua.getAchievement().getCode(),
                        "name", ua.getAchievement().getName(),
                        "icon", ua.getAchievement().getIcon(),
                        "tier", ua.getAchievement().getTier(),
                        "earnedAt", ua.getEarnedAt()))
                .collect(Collectors.toList()));

        return result;
    }

    /**
     * Get leaderboard
     */
    public List<Map<String, Object>> getLeaderboard(String type, int limit) {
        List<UserGamification> top = switch (type) {
            case "streak" -> gamificationRepository.findTopByStreak(PageRequest.of(0, limit));
            case "level" -> gamificationRepository.findTopByLevel(PageRequest.of(0, limit));
            default -> gamificationRepository.findTopByXp(PageRequest.of(0, limit));
        };

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (UserGamification ug : top) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank++);
            entry.put("userId", ug.getUserId());
            entry.put("totalXp", ug.getTotalXp());
            entry.put("level", ug.getLevel());
            entry.put("currentStreak", ug.getCurrentStreak());
            leaderboard.add(entry);
        }
        return leaderboard;
    }

    /**
     * Get all achievements with user's unlock status
     */
    public List<Map<String, Object>> getAchievementsWithStatus(Long userId) {
        Set<String> earnedCodes = new HashSet<>(userAchievementRepository.findAchievementCodesByUserId(userId));
        List<Achievement> all = achievementRepository.findByIsHiddenFalse();
        UserGamification stats = getOrCreateStats(userId);

        return all.stream().map(a -> {
            Map<String, Object> achievement = new HashMap<>();
            achievement.put("code", a.getCode());
            achievement.put("name", a.getName());
            achievement.put("description", a.getDescription());
            achievement.put("icon", a.getIcon());
            achievement.put("tier", a.getTier());
            achievement.put("xpReward", a.getXpReward());
            achievement.put("category", a.getCategory());
            achievement.put("unlocked", earnedCodes.contains(a.getCode()));

            // Calculate progress for count-based achievements
            if (!earnedCodes.contains(a.getCode()) && "count".equals(a.getRequirementType())) {
                int current = switch (a.getCategory()) {
                    case "notes" -> stats.getNotesCreated();
                    case "study" -> a.getCode().contains("flashcard") ? stats.getFlashcardsReviewed()
                            : a.getCode().contains("study") ? stats.getTotalStudyMinutes()
                                    : stats.getQuizzesCompleted();
                    case "streak" -> stats.getCurrentStreak();
                    default -> 0;
                };
                achievement.put("progress", Math.min(current, a.getRequirementCount()));
                achievement.put("required", a.getRequirementCount());
            }

            return achievement;
        }).collect(Collectors.toList());
    }

    // ============ Helpers ============

    public UserGamification getOrCreateStats(Long userId) {
        return gamificationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserGamification newStats = UserGamification.builder()
                            .userId(userId)
                            .build();
                    return gamificationRepository.save(newStats);
                });
    }
}
