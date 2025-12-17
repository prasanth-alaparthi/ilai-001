package com.muse.ai.service;

import com.muse.ai.entity.Subscription;
import com.muse.ai.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Service to check feature access based on user subscription tier.
 * 
 * Tiers:
 * - FREE: Basic features (notes, journal, feed, basic AI)
 * - PREMIUM (Student Pro): All AI features, no ads
 * - INSTITUTIONAL: All features (via linked institution)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureAccessService {

    private final SubscriptionRepository subscriptionRepository;
    private final WebClient.Builder webClientBuilder;

    // Feature categories
    private static final Set<String> FREE_FEATURES = Set.of(
            "notes", "journal", "feed", "search", "calendar",
            "ai_chat_basic", "profile", "settings");

    private static final Set<String> PRO_FEATURES = Set.of(
            "flashcards", "mindmap", "studyguide", "quiz",
            "audio_overview", "voice_notes", "doubt_solver",
            "deep_research", "quantum_lab", "semantic_search",
            "ai_unlimited", "gamification_full", "achievements");

    private static final Set<String> INSTITUTION_FEATURES = Set.of(
            "classroom", "assignments", "clubs", "grading",
            "parent_portal", "teacher_dashboard", "admin_dashboard",
            "student_progress", "screen_time", "performance_alerts");

    // AI feature daily limits for free tier
    private static final int FREE_AI_DAILY_LIMIT = 5;

    /**
     * Check if user can access a specific feature
     */
    public boolean canAccess(Long userId, String feature) {
        UserTier tier = getUserTier(userId);
        return canAccessWithTier(tier, feature);
    }

    /**
     * Check access with JWT (for controller usage)
     */
    public boolean canAccess(Jwt jwt, String feature) {
        Long userId = Long.parseLong(jwt.getSubject());
        return canAccess(userId, feature);
    }

    /**
     * Check if feature is accessible for a given tier
     */
    public boolean canAccessWithTier(UserTier tier, String feature) {
        // Free features available to all
        if (FREE_FEATURES.contains(feature)) {
            return true;
        }

        // Pro features need PREMIUM or INSTITUTIONAL
        if (PRO_FEATURES.contains(feature)) {
            return tier == UserTier.PREMIUM || tier == UserTier.INSTITUTIONAL;
        }

        // Institution features only for INSTITUTIONAL
        if (INSTITUTION_FEATURES.contains(feature)) {
            return tier == UserTier.INSTITUTIONAL;
        }

        // Unknown feature - deny by default
        log.warn("Unknown feature requested: {}", feature);
        return false;
    }

    /**
     * Get user's current tier
     */
    public UserTier getUserTier(Long userId) {
        // First check if user has an active subscription
        Optional<Subscription> subscription = subscriptionRepository.findByUserId(userId);

        if (subscription.isPresent()) {
            String plan = subscription.get().getPlan();
            if ("pro".equals(plan) || "pro_plus".equals(plan) || "enterprise".equals(plan)) {
                return UserTier.PREMIUM;
            }
        }

        // Check if linked to institution (via auth service)
        if (isLinkedToInstitution(userId)) {
            return UserTier.INSTITUTIONAL;
        }

        return UserTier.FREE;
    }

    /**
     * Check if user is linked to an active institution
     */
    private boolean isLinkedToInstitution(Long userId) {
        try {
            // Call auth service to check institution status
            Map<String, Object> response = webClientBuilder.build()
                    .get()
                    .uri("http://muse-auth-service:8081/api/auth/users/{userId}/institution-status", userId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                Boolean hasActiveInstitution = (Boolean) response.get("hasActiveInstitution");
                return Boolean.TRUE.equals(hasActiveInstitution);
            }
        } catch (Exception e) {
            log.warn("Failed to check institution status for user {}: {}", userId, e.getMessage());
        }
        return false;
    }

    /**
     * Get feature access info for frontend
     */
    public Map<String, Object> getAccessInfo(Long userId) {
        UserTier tier = getUserTier(userId);

        return Map.of(
                "tier", tier.name(),
                "freeFeatures", FREE_FEATURES,
                "proFeatures", PRO_FEATURES,
                "institutionFeatures", INSTITUTION_FEATURES,
                "canAccessPro", tier == UserTier.PREMIUM || tier == UserTier.INSTITUTIONAL,
                "canAccessInstitution", tier == UserTier.INSTITUTIONAL,
                "aiDailyLimit", tier == UserTier.FREE ? FREE_AI_DAILY_LIMIT : -1);
    }

    /**
     * Get required tier for a feature
     */
    public String getRequiredTier(String feature) {
        if (FREE_FEATURES.contains(feature))
            return "FREE";
        if (PRO_FEATURES.contains(feature))
            return "PREMIUM";
        if (INSTITUTION_FEATURES.contains(feature))
            return "INSTITUTIONAL";
        return "UNKNOWN";
    }

    /**
     * User tier enum
     */
    public enum UserTier {
        FREE,
        PREMIUM,
        INSTITUTIONAL
    }
}
