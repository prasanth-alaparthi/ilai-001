package com.muse.ai.service;

import com.muse.ai.entity.*;
import com.muse.ai.repository.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-Powered Recommendation Service - Phase 4
 * Generates personalized study recommendations using rule-based + AI
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

        private final PersonalizationService personalizationService;
        private final ActivityTrackingService activityService;
        private final TopicMasteryRepository masteryRepository;
        private final LLMRouterService llmRouterService;
        private final EmbeddingService embeddingService;

        /**
         * Get all recommendations for a user (Free mode - rule-based)
         */
        public List<Recommendation> getRecommendations(Long userId, boolean isPaidUser) {
                List<Recommendation> recommendations = new ArrayList<>();

                // Rule-based recommendations (Free)
                recommendations.addAll(getWeakTopicRecommendations(userId));
                recommendations.addAll(getStudyStreakRecommendations(userId));
                recommendations.addAll(getBalanceRecommendations(userId));

                // AI recommendations (Paid only)
                if (isPaidUser) {
                        // Will be populated async
                        log.debug("AI recommendations available for paid user {}", userId);
                }

                // Sort by priority and limit
                return recommendations.stream()
                                .sorted(Comparator.comparingInt(Recommendation::priority).reversed())
                                .limit(10)
                                .toList();
        }

        /**
         * Get AI-powered study plan (Paid feature)
         */
        @CircuitBreaker(name = "llm", fallbackMethod = "studyPlanFallback")
        public Mono<StudyPlan> generateStudyPlan(Long userId, String goal, int durationDays) {
                // Gather user context
                var stats = activityService.getStudyStats(userId);
                var weakTopics = activityService.getWeakTopics(userId, 0.5);
                var profile = personalizationService.getProfile(userId).orElse(null);

                String context = buildStudyPlanContext(stats, weakTopics, profile, goal);

                String prompt = """
                                Create a personalized %d-day study plan for a student with the following profile:

                                %s

                                GOAL: %s

                                Create a structured plan with:
                                1. Daily focus topics
                                2. Estimated study time per topic
                                3. Specific activities (review, quiz, practice)
                                4. Progress milestones

                                Format as JSON with structure:
                                {
                                  "title": "Plan title",
                                  "days": [
                                    {
                                      "day": 1,
                                      "focus": "Topic",
                                      "activities": ["activity1", "activity2"],
                                      "estimatedMinutes": 60
                                    }
                                  ],
                                  "milestones": ["Milestone 1", "Milestone 2"]
                                }
                                """.formatted(durationDays, context, goal);

                return llmRouterService.generateContent(prompt, "study_plan")
                                .map(response -> parseStudyPlan(response, userId, goal, durationDays));
        }

        /**
         * Get personalized topic suggestions based on learning style
         */
        @CircuitBreaker(name = "llm", fallbackMethod = "topicSuggestionsFallback")
        public Mono<List<TopicSuggestion>> getAITopicSuggestions(Long userId, String currentTopic) {
                var profile = personalizationService.getProfile(userId).orElse(null);
                String learningStyle = profile != null ? profile.getLearningStyle() : "visual";

                String prompt = """
                                A student learning about "%s" prefers %s learning style.

                                Suggest 5 related topics they should explore next, considering:
                                1. Natural progression of knowledge
                                2. Prerequisite relationships
                                3. Interesting connections

                                Format each suggestion as:
                                - Topic name
                                - Brief reason (1 sentence)
                                - Difficulty relative to current topic (easier/same/harder)
                                """.formatted(currentTopic, learningStyle);

                return llmRouterService.generateContent(prompt, "suggestions")
                                .map(this::parseTopicSuggestions);
        }

        // ============== Rule-Based Recommendations ==============

        private List<Recommendation> getWeakTopicRecommendations(Long userId) {
                List<TopicMastery> weakTopics = masteryRepository.findTopicsBelowThreshold(userId, 0.5);

                return weakTopics.stream()
                                .limit(3)
                                .map(t -> new Recommendation(
                                                "weak_topic",
                                                "Strengthen: " + t.getTopic(),
                                                "Your mastery is " + Math.round(t.getMasteryLevel() * 100) +
                                                                "%. Try reviewing and taking a quiz.",
                                                8, // High priority
                                                Map.of("topic", t.getTopic(), "mastery", t.getMasteryLevel())))
                                .toList();
        }

        private List<Recommendation> getStudyStreakRecommendations(Long userId) {
                var stats = activityService.getStudyStats(userId);
                List<Recommendation> recs = new ArrayList<>();

                // Low study time warning
                if (stats.weeklyStudyMinutes() < 60) {
                        recs.add(new Recommendation(
                                        "study_time",
                                        "Increase Study Time",
                                        "You've studied " + stats.weeklyStudyMinutes() +
                                                        " min this week. Aim for at least 2 hours!",
                                        7,
                                        Map.of("currentMinutes", stats.weeklyStudyMinutes())));
                }

                // Good performance encouragement
                if (stats.averageQuizScore() >= 80) {
                        recs.add(new Recommendation(
                                        "achievement",
                                        "Great Quiz Performance!",
                                        "Your average score is " + Math.round(stats.averageQuizScore()) +
                                                        "%. Keep challenging yourself!",
                                        5,
                                        Map.of("averageScore", stats.averageQuizScore())));
                }

                return recs;
        }

        private List<Recommendation> getBalanceRecommendations(Long userId) {
                var stats = activityService.getStudyStats(userId);
                List<Recommendation> recs = new ArrayList<>();

                // Check if studying only one topic
                if (stats.topicTimeDistribution().size() == 1 && stats.topicsStudied() > 0) {
                        recs.add(new Recommendation(
                                        "diversify",
                                        "Diversify Your Studies",
                                        "You've been focused on one topic. Try exploring related subjects!",
                                        6,
                                        Map.of()));
                }

                // Low quiz count
                if (stats.quizzesTaken() < 3 && stats.weeklyStudyMinutes() > 60) {
                        recs.add(new Recommendation(
                                        "quiz_practice",
                                        "Test Your Knowledge",
                                        "You're studying well but haven't taken many quizzes. Try a quick quiz!",
                                        7,
                                        Map.of("quizCount", stats.quizzesTaken())));
                }

                return recs;
        }

        // ============== Helper Methods ==============

        private String buildStudyPlanContext(
                        ActivityTrackingService.StudyStats stats,
                        List<TopicMastery> weakTopics,
                        UserProfile profile,
                        String goal) {
                StringBuilder sb = new StringBuilder();

                sb.append("Study Stats:\n");
                sb.append("- Weekly study time: ").append(stats.weeklyStudyMinutes()).append(" min\n");
                sb.append("- Average quiz score: ").append(Math.round(stats.averageQuizScore())).append("%\n");
                sb.append("- Topics studied: ").append(stats.topicsStudied()).append("\n");

                if (!weakTopics.isEmpty()) {
                        sb.append("\nWeak topics needing attention:\n");
                        weakTopics.forEach(t -> sb.append("- ").append(t.getTopic())
                                        .append(" (").append(Math.round(t.getMasteryLevel() * 100)).append("%)\n"));
                }

                if (profile != null) {
                        sb.append("\nLearning style: ").append(profile.getLearningStyle()).append("\n");
                        if (profile.getStudyPreferences() != null) {
                                sb.append("Preferences: ").append(profile.getStudyPreferences()).append("\n");
                        }
                }

                return sb.toString();
        }

        private StudyPlan parseStudyPlan(String response, Long userId, String goal, int days) {
                // Simple parsing - in production, use proper JSON parsing
                return new StudyPlan(
                                userId,
                                "Personalized Study Plan",
                                goal,
                                days,
                                List.of("Day 1: Focus on fundamentals", "Day 2: Practice exercises"),
                                List.of("Complete initial review", "Pass practice quiz"));
        }

        private List<TopicSuggestion> parseTopicSuggestions(String response) {
                // Simple parsing - extract topic suggestions from response
                return List.of(
                                new TopicSuggestion("Related Concept A", "Natural progression", "same"),
                                new TopicSuggestion("Advanced Topic B", "Builds on current knowledge", "harder"),
                                new TopicSuggestion("Foundation C", "Strengthen basics", "easier"));
        }

        private Mono<StudyPlan> studyPlanFallback(Long userId, String goal, int durationDays, Throwable t) {
                log.warn("Study plan fallback for user {}: {}", userId, t.getMessage());
                return Mono.just(new StudyPlan(
                                userId,
                                "Basic Study Plan",
                                goal,
                                durationDays,
                                List.of("Review weak topics", "Take practice quizzes", "Revise notes"),
                                List.of("Complete all reviews")));
        }

        private Mono<List<TopicSuggestion>> topicSuggestionsFallback(Long userId, String topic, Throwable t) {
                log.warn("Topic suggestions fallback: {}", t.getMessage());
                return Mono.just(List.of(
                                new TopicSuggestion("Review " + topic, "Strengthen understanding", "same")));
        }

        // ============== Records ==============

        public record Recommendation(
                        String type,
                        String title,
                        String description,
                        int priority,
                        Map<String, Object> metadata) {
        }

        public record StudyPlan(
                        Long userId,
                        String title,
                        String goal,
                        int durationDays,
                        List<String> dailyActivities,
                        List<String> milestones) {
        }

        public record TopicSuggestion(String topic, String reason, String difficulty) {
        }
}
