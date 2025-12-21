package com.muse.social.reputation.controller;

import com.muse.social.reputation.entity.ReputationHistory;
import com.muse.social.reputation.entity.UserReputation;
import com.muse.social.reputation.service.ReputationService;
import com.muse.social.billing.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Reputation Controller for gamification endpoints.
 * Integrates with Auth Service user_id via JWT.
 */
@RestController
@RequestMapping("/api/reputation")
@RequiredArgsConstructor
public class ReputationController {

    private final ReputationService reputationService;
    private final FeatureFlagService featureFlagService;

    /**
     * Get current user's reputation summary.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyReputation(
            @AuthenticationPrincipal String userId) {
        Long id = Long.parseLong(userId);
        Map<String, Object> summary = reputationService.getReputationSummary(id);

        // Add tier info
        summary.put("tier", featureFlagService.getUserTier(id));

        return ResponseEntity.ok(summary);
    }

    /**
     * Get specific user's public reputation.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUserReputation(@PathVariable Long userId) {
        Map<String, Object> summary = reputationService.getReputationSummary(userId);

        // Remove sensitive fields for public view
        summary.remove("tier");

        return ResponseEntity.ok(summary);
    }

    /**
     * Get current user's reputation history.
     */
    @GetMapping("/me/history")
    public ResponseEntity<List<ReputationHistory>> getMyHistory(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "20") int limit) {
        Long id = Long.parseLong(userId);
        return ResponseEntity.ok(reputationService.getRecentHistory(id, limit));
    }

    /**
     * Get leaderboard.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserReputation>> getLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(reputationService.getLeaderboard(limit));
    }

    /**
     * Get level thresholds for UI.
     */
    @GetMapping("/levels")
    public ResponseEntity<Map<String, Object>> getLevelInfo() {
        return ResponseEntity.ok(Map.of(
                "levels", Map.of(
                        1, Map.of("min", 0, "max", 99, "name", "Novice"),
                        2, Map.of("min", 100, "max", 299, "name", "Learner"),
                        3, Map.of("min", 300, "max", 599, "name", "Student"),
                        4, Map.of("min", 600, "max", 999, "name", "Scholar"),
                        5, Map.of("min", 1000, "max", 1499, "name", "Academic"),
                        6, Map.of("min", 1500, "max", 2099, "name", "Expert"),
                        7, Map.of("min", 2100, "max", 2799, "name", "Master"),
                        8, Map.of("min", 2800, "max", 3599, "name", "Professor"),
                        9, Map.of("min", 3600, "max", 4499, "name", "Distinguished"),
                        10, Map.of("min", 4500, "max", Integer.MAX_VALUE, "name", "Grandmaster"))));
    }
}
