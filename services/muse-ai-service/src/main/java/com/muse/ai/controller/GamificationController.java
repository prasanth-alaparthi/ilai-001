package com.muse.ai.controller;

import com.muse.ai.service.GamificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Gamification Controller - XP, Levels, Achievements, Leaderboard
 */
@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@Slf4j
public class GamificationController {

    private final GamificationService gamificationService;

    // ============ User Stats ============

    /**
     * Get user's gamification stats
     */
    @GetMapping("/stats/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        return ResponseEntity.ok(gamificationService.getUserStats(userId));
    }

    /**
     * Get current user's stats (userId from token)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMyStats(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID required"));
        }
        return ResponseEntity.ok(gamificationService.getUserStats(userId));
    }

    // ============ Achievements ============

    /**
     * Get all achievements with user's progress
     */
    @GetMapping("/achievements/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getAchievements(@PathVariable Long userId) {
        return ResponseEntity.ok(gamificationService.getAchievementsWithStatus(userId));
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<Map<String, Object>>> getMyAchievements(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().body(List.of());
        }
        return ResponseEntity.ok(gamificationService.getAchievementsWithStatus(userId));
    }

    // ============ Leaderboard ============

    /**
     * Get leaderboard
     * 
     * @param type  - "xp" (default), "streak", "level"
     * @param limit - number of entries (default 10, max 100)
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(defaultValue = "xp") String type,
            @RequestParam(defaultValue = "10") int limit) {
        limit = Math.min(limit, 100);
        return ResponseEntity.ok(gamificationService.getLeaderboard(type, limit));
    }

    // ============ XP Events (called internally by other services) ============

    /**
     * Award XP for an action
     */
    @PostMapping("/xp/award")
    public ResponseEntity<Map<String, Object>> awardXp(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String eventType = (String) request.get("eventType");
        int xpAmount = ((Number) request.get("xpAmount")).intValue();
        String description = (String) request.getOrDefault("description", "XP reward");
        String referenceId = (String) request.get("referenceId");

        return ResponseEntity.ok(gamificationService.awardXp(userId, eventType, xpAmount, description, referenceId));
    }

    /**
     * Log note creation
     */
    @PostMapping("/events/note-created")
    public ResponseEntity<Map<String, Object>> onNoteCreated(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String noteId = (String) request.get("noteId");
        return ResponseEntity.ok(gamificationService.onNoteCreated(userId, noteId));
    }

    /**
     * Log quiz completion
     */
    @PostMapping("/events/quiz-completed")
    public ResponseEntity<Map<String, Object>> onQuizCompleted(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String quizId = (String) request.get("quizId");
        int score = ((Number) request.get("score")).intValue();
        int total = ((Number) request.get("total")).intValue();
        return ResponseEntity.ok(gamificationService.onQuizCompleted(userId, quizId, score, total));
    }

    /**
     * Log flashcard reviews
     */
    @PostMapping("/events/flashcards-reviewed")
    public ResponseEntity<Map<String, Object>> onFlashcardsReviewed(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        int count = ((Number) request.get("count")).intValue();
        return ResponseEntity.ok(gamificationService.onFlashcardsReviewed(userId, count));
    }

    /**
     * Log study session completion
     */
    @PostMapping("/events/study-session")
    public ResponseEntity<Map<String, Object>> onStudySession(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        int durationMinutes = ((Number) request.get("durationMinutes")).intValue();
        return ResponseEntity.ok(gamificationService.onStudySessionCompleted(userId, durationMinutes));
    }
}
