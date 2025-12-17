package com.muse.ai.controller;

import com.muse.ai.service.FeatureAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for feature access information.
 * Provides endpoints for frontend to check feature availability.
 */
@RestController
@RequestMapping("/api/access")
@RequiredArgsConstructor
public class FeatureAccessController {

    private final FeatureAccessService featureAccessService;

    /**
     * Get current user's access information
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAccessInfo(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(featureAccessService.getAccessInfo(userId));
    }

    /**
     * Check if user can access a specific feature
     */
    @GetMapping("/check/{feature}")
    public ResponseEntity<Map<String, Object>> checkFeatureAccess(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String feature) {
        Long userId = Long.parseLong(jwt.getSubject());
        boolean canAccess = featureAccessService.canAccess(userId, feature);
        String requiredTier = featureAccessService.getRequiredTier(feature);

        return ResponseEntity.ok(Map.of(
                "feature", feature,
                "canAccess", canAccess,
                "requiredTier", requiredTier,
                "userTier", featureAccessService.getUserTier(userId).name()));
    }

    /**
     * Get user's current tier
     */
    @GetMapping("/tier")
    public ResponseEntity<Map<String, Object>> getUserTier(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        FeatureAccessService.UserTier tier = featureAccessService.getUserTier(userId);

        return ResponseEntity.ok(Map.of(
                "tier", tier.name(),
                "isPro", tier == FeatureAccessService.UserTier.PREMIUM ||
                        tier == FeatureAccessService.UserTier.INSTITUTIONAL,
                "isInstitution", tier == FeatureAccessService.UserTier.INSTITUTIONAL));
    }
}
