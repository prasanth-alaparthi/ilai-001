package com.muse.social.billing.service;

import com.muse.social.billing.entity.UserSubscription;
import com.muse.social.billing.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;

/**
 * Feature Flag Service for tier-based feature access control.
 * 
 * Architecture:
 * - PostgreSQL: Source of truth for subscription_tier
 * - Redis: Sub-millisecond access cache with 30-day TTL
 * - WebSocket: Real-time feature updates to clients
 * 
 * Cache Keys:
 * - user:tier:{userId} → tier string (free|general|pro|phd)
 * - user:features:{userId} → Set of feature strings
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserSubscriptionRepository subscriptionRepo;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String TIER_CACHE_PREFIX = "user:tier:";
    private static final String FEATURES_CACHE_PREFIX = "user:features:";
    private static final Duration CACHE_TTL = Duration.ofDays(30);

    // Tier → Features mapping
    private static final Map<String, List<String>> TIER_FEATURES = Map.of(
            "free", List.of(
                    "notes", "notes_basic",
                    "feed", "feed_read",
                    "chat_basic",
                    "journal"),
            "general", List.of(
                    "notes", "notes_basic", "notes_export",
                    "feed", "feed_read", "feed_post",
                    "chat", "chat_groups",
                    "journal", "journal_templates",
                    "bounties", "bounties_create", "bounties_solve",
                    "ai_assist_basic",
                    "calendar"),
            "pro", List.of(
                    "notes", "notes_basic", "notes_export", "notes_ai",
                    "feed", "feed_read", "feed_post", "feed_analytics",
                    "chat", "chat_groups", "chat_video",
                    "journal", "journal_templates", "journal_ai",
                    "bounties", "bounties_create", "bounties_solve", "bounties_premium",
                    "labs", "labs_solver", "labs_visualize",
                    "war_rooms", "war_rooms_create", "war_rooms_join",
                    "ai_assist", "ai_assist_advanced",
                    "calendar", "calendar_sync",
                    "flashcards", "flashcards_ai"),
            "phd", List.of(
                    "notes", "notes_basic", "notes_export", "notes_ai", "notes_research",
                    "feed", "feed_read", "feed_post", "feed_analytics",
                    "chat", "chat_groups", "chat_video",
                    "journal", "journal_templates", "journal_ai", "journal_publish",
                    "bounties", "bounties_create", "bounties_solve", "bounties_premium",
                    "labs", "labs_solver", "labs_visualize", "labs_unlimited",
                    "war_rooms", "war_rooms_create", "war_rooms_join", "war_rooms_unlimited",
                    "ai_assist", "ai_assist_advanced", "ai_research",
                    "paper_graph", "bedrock_claude", "unlimited_compute",
                    "calendar", "calendar_sync",
                    "flashcards", "flashcards_ai", "flashcards_unlimited",
                    "priority_support"));

    /**
     * Get user's subscription tier.
     * Uses Redis cache for sub-millisecond access.
     * 
     * @param userId User ID from Auth Service
     * @return Tier string: free | general | pro | phd
     */
    public String getUserTier(Long userId) {
        String cacheKey = TIER_CACHE_PREFIX + userId;

        try {
            // Try Redis cache first (sub-millisecond)
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return cached.toString();
            }
        } catch (Exception e) {
            log.error("Redis connection failed in getUserTier: {}. Falling back to PostgreSQL.", e.getMessage());
        }

        // Fall back to PostgreSQL
        String tier = subscriptionRepo.findByUserId(userId)
                .map(UserSubscription::getTier)
                .orElse("free");

        try {
            // Cache the result
            redisTemplate.opsForValue().set(cacheKey, tier, CACHE_TTL);
        } catch (Exception e) {
            log.warn("Failed to cache tier in Redis: {}", e.getMessage());
        }

        return tier;
    }

    /**
     * Get user's tier with feature list.
     */
    public String getUserTier(String userId) {
        return getUserTier(Long.parseLong(userId));
    }

    /**
     * Enable features for a user's tier.
     * Called when subscription changes.
     */
    @Transactional
    public void enableTierFeatures(String userId, String tier) {
        enableTierFeatures(Long.parseLong(userId), tier);
    }

    @Transactional
    public void enableTierFeatures(Long userId, String tier) {
        List<String> features = TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free"));

        String tierKey = TIER_CACHE_PREFIX + userId;
        String featuresKey = FEATURES_CACHE_PREFIX + userId;

        try {
            // Update tier cache
            redisTemplate.opsForValue().set(tierKey, tier, CACHE_TTL);

            // Update features cache
            redisTemplate.delete(featuresKey);
            if (!features.isEmpty()) {
                redisTemplate.opsForSet().add(featuresKey, features.toArray(new String[0]));
                redisTemplate.expire(featuresKey, CACHE_TTL);
            }
        } catch (Exception e) {
            log.error("Failed to update Redis cache in enableTierFeatures: {}", e.getMessage());
        }

        log.info("Enabled {} features for user {} (tier: {})",
                features.size(), userId, tier);

        // Broadcast feature update to connected clients
        broadcastFeatureUpdate(userId, tier, features);
    }

    /**
     * Check if user has a specific feature.
     * Sub-millisecond lookup via Redis.
     */
    public boolean hasFeature(Long userId, String feature) {
        String featuresKey = FEATURES_CACHE_PREFIX + userId;

        try {
            // Check Redis set
            Boolean isMember = redisTemplate.opsForSet().isMember(featuresKey, feature);

            if (isMember != null && isMember) {
                return true;
            }
        } catch (Exception e) {
            log.error("Redis connection failed in hasFeature: {}. Falling back to tier lookup.", e.getMessage());
        }

        // Cache miss - reload from tier
        String tier = getUserTier(userId);
        List<String> features = TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free"));

        try {
            // Rebuild cache
            if (!features.isEmpty()) {
                redisTemplate.opsForSet().add(featuresKey, features.toArray(new String[0]));
                redisTemplate.expire(featuresKey, CACHE_TTL);
            }
        } catch (Exception e) {
            log.warn("Failed to rebuild feature cache in Redis: {}", e.getMessage());
        }

        return features.contains(feature);
    }

    /**
     * Check feature access by string userId.
     */
    public boolean hasFeature(String userId, String feature) {
        return hasFeature(Long.parseLong(userId), feature);
    }

    /**
     * Get all features for a user.
     */
    public Set<String> getUserFeatures(Long userId) {
        String featuresKey = FEATURES_CACHE_PREFIX + userId;

        try {
            Set<Object> cached = redisTemplate.opsForSet().members(featuresKey);

            if (cached != null && !cached.isEmpty()) {
                Set<String> result = new HashSet<>();
                for (Object f : cached) {
                    result.add(f.toString());
                }
                return result;
            }
        } catch (Exception e) {
            log.error("Redis connection failed in getUserFeatures: {}. Falling back to tier lookup.", e.getMessage());
        }

        // Cache miss - load from tier
        String tier = getUserTier(userId);
        List<String> features = TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free"));

        try {
            // Cache and return
            if (!features.isEmpty()) {
                redisTemplate.opsForSet().add(featuresKey, features.toArray(new String[0]));
                redisTemplate.expire(featuresKey, CACHE_TTL);
            }
        } catch (Exception e) {
            log.warn("Failed to cache features in Redis: {}", e.getMessage());
        }

        return new HashSet<>(features);
    }

    /**
     * Get features for a specific tier (for pricing page).
     */
    public List<String> getTierFeatures(String tier) {
        return TIER_FEATURES.getOrDefault(tier, TIER_FEATURES.get("free"));
    }

    /**
     * Get all tiers with their features (for comparison).
     */
    public Map<String, List<String>> getAllTierFeatures() {
        return TIER_FEATURES;
    }

    /**
     * Check if user has access to a feature, throw exception if not.
     */
    public void requireFeature(Long userId, String feature) {
        if (!hasFeature(userId, feature)) {
            String tier = getUserTier(userId);
            throw new FeatureNotAvailableException(
                    String.format("Feature '%s' is not available on the %s plan. Please upgrade.",
                            feature, tier));
        }
    }

    /**
     * Require feature by string userId.
     */
    public void requireFeature(String userId, String feature) {
        requireFeature(Long.parseLong(userId), feature);
    }

    /**
     * Invalidate all caches for a user.
     * Call this when subscription changes.
     */
    public void invalidateUserCache(Long userId) {
        try {
            redisTemplate.delete(TIER_CACHE_PREFIX + userId);
            redisTemplate.delete(FEATURES_CACHE_PREFIX + userId);
        } catch (Exception e) {
            log.error("Failed to invalidate Redis cache for user {}: {}", userId, e.getMessage());
        }
        log.debug("Invalidated feature cache for user {}", userId);
    }

    /**
     * Broadcast feature update via WebSocket.
     */
    private void broadcastFeatureUpdate(Long userId, String tier, List<String> features) {
        try {
            Map<String, Object> message = Map.of(
                    "type", "feature_update",
                    "tier", tier,
                    "features", features,
                    "timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/features",
                    message);
        } catch (Exception e) {
            log.debug("Could not broadcast feature update: {}", e.getMessage());
        }
    }

    /**
     * Get feature access summary for user dashboard.
     */
    public Map<String, Object> getFeatureSummary(Long userId) {
        String tier = getUserTier(userId);
        Set<String> features = getUserFeatures(userId);

        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", userId);
        summary.put("tier", tier);
        summary.put("features", features);
        summary.put("featureCount", features.size());

        // Compare with upgrade options
        if (!"phd".equals(tier)) {
            String nextTier = getNextTier(tier);
            List<String> nextFeatures = TIER_FEATURES.get(nextTier);
            List<String> newFeatures = nextFeatures.stream()
                    .filter(f -> !features.contains(f))
                    .toList();
            summary.put("upgradeNextTier", nextTier);
            summary.put("upgradeNewFeatures", newFeatures);
        }

        return summary;
    }

    private String getNextTier(String currentTier) {
        return switch (currentTier) {
            case "free" -> "general";
            case "general" -> "pro";
            case "pro" -> "phd";
            default -> "phd";
        };
    }

    // Exception class
    public static class FeatureNotAvailableException extends RuntimeException {
        public FeatureNotAvailableException(String message) {
            super(message);
        }
    }
}
