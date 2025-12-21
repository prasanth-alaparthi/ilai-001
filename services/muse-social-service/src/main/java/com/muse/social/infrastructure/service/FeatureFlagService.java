package com.muse.social.infrastructure.service;

import com.muse.social.domain.billing.entity.UserSubscription;
import com.muse.social.domain.billing.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;

/**
 * Feature Flag Service - Tier Protection.
 * 
 * Location: infrastructure/service
 * 
 * Verifies if a user is on the ₹199 (General) tier or higher
 * before allowing premium features like:
 * - Posting Bounties
 * - Hosting War-Rooms
 * - AI Research features
 * 
 * Architecture:
 * - PostgreSQL: Source of truth (user_subscriptions table)
 * - Redis: Sub-millisecond access cache (30-day TTL)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserSubscriptionRepository subscriptionRepo;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String TIER_KEY_PREFIX = "user:tier:";
    private static final String FEATURES_KEY_PREFIX = "user:features:";
    private static final Duration CACHE_TTL = Duration.ofDays(30);

    // Tier pricing (for reference)
    // Free: ₹0, General: ₹199, Pro: ₹399, PhD: ₹699

    private static final Map<String, List<String>> TIER_FEATURES = Map.of(
            "free", List.of(
                    "notes", "feed_read", "chat_basic", "journal"),
            "general", List.of(
                    // All free features +
                    "notes", "notes_export", "feed", "chat", "journal", "journal_templates",
                    "bounties", "bounties_create", "bounties_solve",
                    "calendar", "ai_assist_basic"),
            "pro", List.of(
                    // All general features +
                    "notes", "notes_export", "notes_ai", "feed", "chat", "chat_video",
                    "journal", "journal_templates", "journal_ai",
                    "bounties", "bounties_create", "bounties_solve", "bounties_premium",
                    "labs", "labs_solver", "labs_visualize",
                    "war_rooms", "war_rooms_create", "war_rooms_host",
                    "calendar", "calendar_sync", "ai_assist", "flashcards"),
            "phd", List.of(
                    // All pro features +
                    "notes", "notes_export", "notes_ai", "notes_research",
                    "feed", "chat", "chat_video",
                    "journal", "journal_templates", "journal_ai", "journal_publish",
                    "bounties", "bounties_create", "bounties_solve", "bounties_premium",
                    "labs", "labs_solver", "labs_visualize", "labs_unlimited",
                    "war_rooms", "war_rooms_create", "war_rooms_host", "war_rooms_unlimited",
                    "calendar", "calendar_sync",
                    "ai_assist", "ai_research", "paper_graph", "bedrock_claude",
                    "flashcards", "unlimited_compute", "priority_support"));

    /**
     * Get user's subscription tier.
     * Redis-cached for sub-millisecond access.
     */
    public String getUserTier(Long userId) {
        String cacheKey = TIER_KEY_PREFIX + userId;

        // Check Redis cache
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached.toString();
        }

        // Fetch from PostgreSQL
        String tier = subscriptionRepo.findByUserId(userId)
                .filter(sub -> "active".equals(sub.getStatus()))
                .map(UserSubscription::getTier)
                .orElse("free");

        // Cache result
        redisTemplate.opsForValue().set(cacheKey, tier, CACHE_TTL);

        return tier;
    }

    /**
     * Check if user has a specific feature.
     */
    public boolean hasFeature(Long userId, String feature) {
        String tier = getUserTier(userId);
        List<String> features = TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free"));
        return features.contains(feature);
    }

    /**
     * Require a feature - throws exception if not available.
     * Used for tier protection before premium operations.
     */
    public void requireFeature(Long userId, String feature) {
        if (!hasFeature(userId, feature)) {
            String tier = getUserTier(userId);
            String requiredTier = getRequiredTierForFeature(feature);

            throw new FeatureNotAvailableException(
                    String.format(
                            "Feature '%s' requires %s plan. Your current plan: %s. Upgrade to access this feature.",
                            feature, requiredTier, tier));
        }
    }

    /**
     * Get which tier is required for a feature.
     */
    private String getRequiredTierForFeature(String feature) {
        if (TIER_FEATURES.get("free").contains(feature))
            return "Free";
        if (TIER_FEATURES.get("general").contains(feature))
            return "General (₹199)";
        if (TIER_FEATURES.get("pro").contains(feature))
            return "Pro (₹399)";
        return "PhD (₹699)";
    }

    /**
     * Check if user is on General (₹199) tier or higher.
     */
    public boolean isPaidUser(Long userId) {
        String tier = getUserTier(userId);
        return !"free".equals(tier);
    }

    /**
     * Check if user can host War Rooms.
     */
    public boolean canHostWarRoom(Long userId) {
        return hasFeature(userId, "war_rooms_host");
    }

    /**
     * Check if user can create bounties.
     */
    public boolean canCreateBounty(Long userId) {
        return hasFeature(userId, "bounties_create");
    }

    /**
     * Get all features for a user.
     */
    public Set<String> getUserFeatures(Long userId) {
        String tier = getUserTier(userId);
        return new HashSet<>(TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free")));
    }

    /**
     * Enable tier features (called when subscription changes).
     */
    @Transactional
    public void enableTierFeatures(Long userId, String tier) {
        String tierKey = TIER_KEY_PREFIX + userId;
        String featuresKey = FEATURES_KEY_PREFIX + userId;

        // Update Redis cache
        redisTemplate.opsForValue().set(tierKey, tier, CACHE_TTL);

        List<String> features = TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free"));
        redisTemplate.delete(featuresKey);
        if (!features.isEmpty()) {
            redisTemplate.opsForSet().add(featuresKey, features.toArray(new String[0]));
            redisTemplate.expire(featuresKey, CACHE_TTL);
        }

        // Notify client via WebSocket
        broadcastFeatureUpdate(userId, tier, features);

        log.info("Updated tier for user {} to {} ({} features)",
                userId, tier, features.size());
    }

    /**
     * Invalidate cache (call when subscription changes).
     */
    public void invalidateCache(Long userId) {
        redisTemplate.delete(TIER_KEY_PREFIX + userId);
        redisTemplate.delete(FEATURES_KEY_PREFIX + userId);
    }

    private void broadcastFeatureUpdate(Long userId, String tier, List<String> features) {
        try {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/features",
                    Map.of(
                            "type", "tier_updated",
                            "tier", tier,
                            "features", features,
                            "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.debug("Failed to broadcast feature update: {}", e.getMessage());
        }
    }

    // Exception
    public static class FeatureNotAvailableException extends RuntimeException {
        public FeatureNotAvailableException(String msg) {
            super(msg);
        }
    }
}
