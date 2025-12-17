package com.muse.ai.controller;

import com.muse.ai.entity.TopicMastery;
import com.muse.ai.entity.UserProfile;
import com.muse.ai.service.*;
import com.muse.ai.service.ActivityTrackingService.*;
import com.muse.ai.service.RecommendationService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Personalization Controller - Phase 4 API
 * Exposes activity tracking, recommendations, and profile management
 */
@RestController
@RequestMapping("/api/personalization")
@RequiredArgsConstructor
@Slf4j
public class PersonalizationApiController {

    private final PersonalizationService personalizationService;
    private final ActivityTrackingService activityService;
    private final RecommendationService recommendationService;

    // ============== Profile ==============

    @GetMapping("/profile")
    public ResponseEntity<UserProfile> getProfile(@RequestHeader("X-User-Id") Long userId) {
        return personalizationService.getProfile(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile/learning-style")
    public ResponseEntity<UserProfile> updateLearningStyle(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> body) {
        personalizationService.updateLearningStyle(userId, body.get("style"));
        return personalizationService.getProfile(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile/preferences")
    public ResponseEntity<UserProfile> updatePreferences(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> preferences) {
        personalizationService.updateStudyPreferences(userId, preferences);
        return personalizationService.getProfile(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ============== Study Sessions ==============

    @PostMapping("/sessions/start")
    public ResponseEntity<Map<String, Object>> startSession(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody StartSessionRequest request) {
        var session = activityService.startSession(userId, request.type(), request.topic());
        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "startedAt", session.getStartedAt()));
    }

    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<Map<String, Object>> endSession(
            @PathVariable Long sessionId,
            @RequestBody(required = false) EndSessionRequest request) {
        Double engagement = request != null ? request.engagementScore() : null;
        Map<String, Object> metadata = request != null ? request.metadata() : null;

        var session = activityService.endSession(sessionId, engagement, metadata);
        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "durationMinutes", session.getDurationMinutes(),
                "engagementScore", session.getEngagementScore()));
    }

    @GetMapping("/sessions/stats")
    public ResponseEntity<StudyStats> getStudyStats(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(activityService.getStudyStats(userId));
    }

    // ============== Quiz Performance ==============

    @PostMapping("/quiz/record")
    public ResponseEntity<Map<String, Object>> recordQuizResult(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody QuizResultRequest request) {
        var result = activityService.recordQuizResult(
                userId,
                request.topic(),
                request.totalQuestions(),
                request.correctAnswers(),
                request.timeSeconds(),
                request.difficulty(),
                request.weakAreas());
        return ResponseEntity.ok(Map.of(
                "id", result.getId(),
                "score", result.getScorePercentage(),
                "recorded", true));
    }

    // ============== Topic Mastery ==============

    @GetMapping("/mastery")
    public ResponseEntity<List<TopicMastery>> getAllMastery(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(activityService.getStrongTopics(userId, 20));
    }

    @GetMapping("/mastery/weak")
    public ResponseEntity<List<TopicMastery>> getWeakTopics(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0.5") double threshold) {
        return ResponseEntity.ok(activityService.getWeakTopics(userId, threshold));
    }

    @GetMapping("/mastery/{topic}")
    public ResponseEntity<TopicMastery> getTopicMastery(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable String topic) {
        return ResponseEntity.ok(activityService.getTopicMastery(userId, topic));
    }

    // ============== Recommendations ==============

    @GetMapping("/recommendations")
    public ResponseEntity<List<Recommendation>> getRecommendations(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "false") boolean isPaid) {
        return ResponseEntity.ok(recommendationService.getRecommendations(userId, isPaid));
    }

    @PostMapping("/study-plan")
    public Mono<ResponseEntity<StudyPlan>> generateStudyPlan(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody StudyPlanRequest request) {
        return recommendationService.generateStudyPlan(userId, request.goal(), request.days())
                .map(ResponseEntity::ok);
    }

    @GetMapping("/suggestions")
    public Mono<ResponseEntity<List<TopicSuggestion>>> getTopicSuggestions(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String currentTopic) {
        return recommendationService.getAITopicSuggestions(userId, currentTopic)
                .map(ResponseEntity::ok);
    }

    // ============== Performance Analytics ==============

    @GetMapping("/trends")
    public ResponseEntity<PerformanceTrend> getPerformanceTrend(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(activityService.getPerformanceTrend(userId));
    }

    // ============== Request Records ==============

    record StartSessionRequest(String type, String topic) {
    }

    record EndSessionRequest(Double engagementScore, Map<String, Object> metadata) {
    }

    record QuizResultRequest(String topic, int totalQuestions, int correctAnswers,
            Integer timeSeconds, String difficulty, List<String> weakAreas) {
    }

    record StudyPlanRequest(String goal, int days) {
    }
}
