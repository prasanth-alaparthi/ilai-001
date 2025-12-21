package com.muse.social.billing.controller;

import com.muse.social.billing.service.FeatureFlagService;
import com.muse.social.billing.service.TokenUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

/**
 * Feature Access Controller for tier management.
 */
@RestController
@RequestMapping("/api/features")
@RequiredArgsConstructor
public class FeatureAccessController {

    private final FeatureFlagService featureFlagService;
    private final TokenUsageService tokenUsageService;

    /**
     * Get current user's tier and features.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyFeatures(
            @AuthenticationPrincipal String userId) {
        Long id = Long.parseLong(userId);
        return ResponseEntity.ok(featureFlagService.getFeatureSummary(id));
    }

    /**
     * Check if user has a specific feature.
     */
    @GetMapping("/check/{feature}")
    public ResponseEntity<Map<String, Object>> checkFeature(
            @AuthenticationPrincipal String userId,
            @PathVariable String feature) {
        Long id = Long.parseLong(userId);
        boolean hasFeature = featureFlagService.hasFeature(id, feature);

        return ResponseEntity.ok(Map.of(
                "feature", feature,
                "hasAccess", hasFeature,
                "tier", featureFlagService.getUserTier(id)));
    }

    /**
     * Get all features for user.
     */
    @GetMapping
    public ResponseEntity<Set<String>> getUserFeatures(
            @AuthenticationPrincipal String userId) {
        Long id = Long.parseLong(userId);
        return ResponseEntity.ok(featureFlagService.getUserFeatures(id));
    }

    /**
     * Get all tier definitions (for pricing page).
     */
    @GetMapping("/tiers")
    public ResponseEntity<Map<String, Object>> getAllTiers() {
        return ResponseEntity.ok(Map.of(
                "tiers", Map.of(
                        "free", Map.of(
                                "name", "Free",
                                "price", 0,
                                "features", featureFlagService.getTierFeatures("free")),
                        "general", Map.of(
                                "name", "General",
                                "price", 199,
                                "features", featureFlagService.getTierFeatures("general")),
                        "pro", Map.of(
                                "name", "Pro",
                                "price", 399,
                                "features", featureFlagService.getTierFeatures("pro")),
                        "phd", Map.of(
                                "name", "PhD",
                                "price", 699,
                                "features", featureFlagService.getTierFeatures("phd")))));
    }

    /**
     * Get token usage for current user.
     */
    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getUsage(
            @AuthenticationPrincipal String userId) {
        Long id = Long.parseLong(userId);
        return ResponseEntity.ok(tokenUsageService.getUsageSummary(id));
    }
}
