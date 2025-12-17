package com.muse.social.feed.controller;

import com.muse.social.feed.repository.UserInterestDNARepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Hashtag Controller - Trending and suggestions
 */
@RestController
@RequestMapping("/api/hashtags")
@RequiredArgsConstructor
public class HashtagController {

    private final UserInterestDNARepository interestDNARepository;

    /**
     * GET /api/hashtags/trending - Get trending hashtags
     */
    @GetMapping("/trending")
    public ResponseEntity<List<Map<String, Object>>> getTrendingHashtags(
            @RequestParam(defaultValue = "20") int limit) {

        // For now, return top hashtags by interest
        // In production, would use TrendingHashtag table
        List<Map<String, Object>> trending = List.of(
                Map.of("hashtag", "physics", "count", 1234),
                Map.of("hashtag", "mathematics", "count", 1100),
                Map.of("hashtag", "chemistry", "count", 890),
                Map.of("hashtag", "biology", "count", 756),
                Map.of("hashtag", "computerscience", "count", 654),
                Map.of("hashtag", "jee", "count", 543),
                Map.of("hashtag", "neet", "count", 432),
                Map.of("hashtag", "engineering", "count", 321),
                Map.of("hashtag", "medicine", "count", 210),
                Map.of("hashtag", "science", "count", 199));

        return ResponseEntity.ok(trending.stream().limit(limit).toList());
    }

    /**
     * GET /api/hashtags/suggest - Autocomplete hashtags
     */
    @GetMapping("/suggest")
    public ResponseEntity<List<String>> suggestHashtags(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {

        List<String> suggestions = interestDNARepository.suggestHashtags(q).stream()
                .limit(limit)
                .toList();

        // Fallback if no matches
        if (suggestions.isEmpty()) {
            suggestions = List.of(
                    q + "basics",
                    q + "advanced",
                    q + "tutorial",
                    q + "problems");
        }

        return ResponseEntity.ok(suggestions);
    }
}
