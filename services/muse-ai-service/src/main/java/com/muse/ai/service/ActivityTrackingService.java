package com.muse.ai.service;

import com.muse.ai.entity.*;
import com.muse.ai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Activity Tracking Service - Phase 4
 * Tracks user study activities for personalization and analytics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityTrackingService {

    private final StudySessionRepository sessionRepository;
    private final QuizPerformanceRepository quizRepository;
    private final TopicMasteryRepository masteryRepository;

    // ============== Study Sessions ==============

    /**
     * Start a new study session
     */
    @Transactional
    public StudySession startSession(Long userId, String sessionType, String topic) {
        StudySession session = StudySession.builder()
                .userId(userId)
                .sessionType(sessionType)
                .topic(topic)
                .startedAt(LocalDateTime.now())
                .build();

        log.info("Starting {} session for user {}: {}", sessionType, userId, topic);
        return sessionRepository.save(session);
    }

    /**
     * End an active session
     */
    @Transactional
    public StudySession endSession(Long sessionId, Double engagementScore, Map<String, Object> metadata) {
        return sessionRepository.findById(sessionId)
                .map(session -> {
                    session.endSession();
                    session.setEngagementScore(engagementScore);
                    if (metadata != null) {
                        session.setMetadata(metadata);
                    }

                    // Update topic mastery
                    if (session.getTopic() != null) {
                        updateTopicExposure(session.getUserId(), session.getTopic());
                    }

                    log.info("Ended session {} - duration: {} min", sessionId, session.getDurationMinutes());
                    return sessionRepository.save(session);
                })
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
    }

    /**
     * Get user's study statistics
     */
    public StudyStats getStudyStats(Long userId) {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime monthAgo = LocalDateTime.now().minusDays(30);

        Integer weeklyMinutes = sessionRepository.getTotalStudyMinutesSince(userId, weekAgo);
        Integer monthlyMinutes = sessionRepository.getTotalStudyMinutesSince(userId, monthAgo);
        Double avgMastery = masteryRepository.getAverageMastery(userId);
        Double avgQuizScore = quizRepository.getAverageScore(userId);

        List<Object[]> topicDistribution = sessionRepository.getTopicStudyTime(userId);
        Map<String, Integer> topicTime = topicDistribution.stream()
                .limit(10)
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> ((Number) r[1]).intValue(),
                        (a, b) -> a,
                        LinkedHashMap::new));

        return new StudyStats(
                weeklyMinutes != null ? weeklyMinutes : 0,
                monthlyMinutes != null ? monthlyMinutes : 0,
                avgMastery != null ? avgMastery : 0.0,
                avgQuizScore != null ? avgQuizScore : 0.0,
                masteryRepository.countByUserId(userId),
                quizRepository.countByUserId(userId),
                topicTime);
    }

    // ============== Quiz Tracking ==============

    /**
     * Record quiz performance
     */
    @Transactional
    public QuizPerformance recordQuizResult(Long userId, String topic, int total, int correct,
            Integer timeSeconds, String difficulty, List<String> weakAreas) {
        QuizPerformance quiz = QuizPerformance.builder()
                .userId(userId)
                .topic(topic)
                .questionsTotal(total)
                .questionsCorrect(correct)
                .scorePercentage((double) correct / total * 100)
                .timeSpentSeconds(timeSeconds)
                .difficultyLevel(difficulty)
                .weakAreas(weakAreas)
                .build();

        // Update topic mastery based on quiz score
        updateTopicMastery(userId, topic, quiz.getScorePercentage() / 100.0);

        log.info("Recorded quiz for user {}: {}/{} in {}", userId, correct, total, topic);
        return quizRepository.save(quiz);
    }

    // ============== Topic Mastery ==============

    /**
     * Get weak topics (mastery < threshold)
     */
    public List<TopicMastery> getWeakTopics(Long userId, double threshold) {
        return masteryRepository.findTopicsBelowThreshold(userId, threshold);
    }

    /**
     * Get strongest topics
     */
    public List<TopicMastery> getStrongTopics(Long userId, int limit) {
        return masteryRepository.findStrongestTopics(userId).stream()
                .limit(limit)
                .toList();
    }

    /**
     * Get mastery for a specific topic
     */
    public TopicMastery getTopicMastery(Long userId, String topic) {
        return masteryRepository.findByUserIdAndTopic(userId, topic)
                .orElseGet(() -> TopicMastery.builder()
                        .userId(userId)
                        .topic(topic)
                        .masteryLevel(0.0)
                        .build());
    }

    @Transactional
    private void updateTopicExposure(Long userId, String topic) {
        TopicMastery mastery = masteryRepository.findByUserIdAndTopic(userId, topic)
                .orElseGet(() -> TopicMastery.builder()
                        .userId(userId)
                        .topic(topic)
                        .masteryLevel(0.1)
                        .build());

        mastery.recordExposure();
        masteryRepository.save(mastery);
    }

    @Transactional
    private void updateTopicMastery(Long userId, String topic, double score) {
        TopicMastery mastery = masteryRepository.findByUserIdAndTopic(userId, topic)
                .orElseGet(() -> TopicMastery.builder()
                        .userId(userId)
                        .topic(topic)
                        .masteryLevel(0.0)
                        .build());

        mastery.updateMastery(score);

        // Update average quiz score
        Double avgScore = quizRepository.getAverageScoreByTopic(userId, topic);
        if (avgScore != null) {
            mastery.setAvgQuizScore(avgScore);
        }

        masteryRepository.save(mastery);
    }

    // ============== Analytics ==============

    /**
     * Get performance trends
     */
    public PerformanceTrend getPerformanceTrend(Long userId) {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<QuizPerformance> recentQuizzes = quizRepository.findRecentQuizzes(userId, weekAgo);

        if (recentQuizzes.isEmpty()) {
            return new PerformanceTrend("stable", 0.0, "Not enough data");
        }

        // Calculate trend
        int midpoint = recentQuizzes.size() / 2;
        double recentAvg = recentQuizzes.subList(0, midpoint).stream()
                .mapToDouble(QuizPerformance::getScorePercentage)
                .average().orElse(0);
        double olderAvg = recentQuizzes.subList(midpoint, recentQuizzes.size()).stream()
                .mapToDouble(QuizPerformance::getScorePercentage)
                .average().orElse(0);

        double change = recentAvg - olderAvg;
        String trend = change > 5 ? "improving" : change < -5 ? "declining" : "stable";
        String message = switch (trend) {
            case "improving" -> "Great progress! Keep up the good work.";
            case "declining" -> "Consider revisiting your weak areas.";
            default -> "Consistent performance. Try challenging yourself more!";
        };

        return new PerformanceTrend(trend, change, message);
    }

    // ============== Records ==============

    public record StudyStats(
            int weeklyStudyMinutes,
            int monthlyStudyMinutes,
            double averageMastery,
            double averageQuizScore,
            long topicsStudied,
            long quizzesTaken,
            Map<String, Integer> topicTimeDistribution) {
    }

    public record PerformanceTrend(String trend, double changePercent, String message) {
    }
}
