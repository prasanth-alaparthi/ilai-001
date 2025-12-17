package com.muse.ai.controller;

import com.muse.ai.service.FSRSService;
import com.muse.ai.service.FSRSService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Flashcard Controller - FSRS spaced repetition endpoints
 */
@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FSRSService fsrsService;

    @GetMapping("/due")
    public ResponseEntity<List<DueCard>> getDueCards(@AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        return ResponseEntity.ok(fsrsService.getDueCards(userId));
    }

    @PostMapping("/{flashcardId}/review")
    public ResponseEntity<ReviewResult> submitReview(
            @PathVariable UUID flashcardId,
            @RequestBody ReviewRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        return ResponseEntity.ok(fsrsService.processReview(flashcardId, userId, request.rating()));
    }

    @GetMapping("/stats")
    public ResponseEntity<StudyStats> getStats(@AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        return ResponseEntity.ok(fsrsService.getStats(userId));
    }

    @GetMapping("/forecast")
    public ResponseEntity<Map<String, Object>> getForecast(@AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        StudyStats stats = fsrsService.getStats(userId);
        return ResponseEntity.ok(Map.of(
                "dueToday", stats.getDueToday(),
                "overdue", stats.getOverdue(),
                "totalCards", stats.getTotalCards(),
                "retention", Math.round(stats.getAverageRetention() * 100) + "%"));
    }

    private Long extractUserId(Jwt jwt) {
        if (jwt == null)
            return 1L;
        Object userId = jwt.getClaim("userId");
        if (userId instanceof Number)
            return ((Number) userId).longValue();
        return Long.parseLong(jwt.getSubject());
    }

    public record ReviewRequest(int rating) {
    }
}
