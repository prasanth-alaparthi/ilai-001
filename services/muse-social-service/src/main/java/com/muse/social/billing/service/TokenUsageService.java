package com.muse.social.billing.service;

import com.muse.social.billing.entity.TokenUsage;
import com.muse.social.billing.repository.UserSubscriptionRepository;
import com.stripe.model.UsageRecord;
import com.stripe.param.UsageRecordCreateOnSubscriptionItemParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Token Usage Service for tracking AI/LLM token consumption.
 * Uses Redis for real-time tracking, syncs to Stripe for metered billing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenUsageService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserSubscriptionRepository subscriptionRepo;

    // Token pricing (per 1K tokens) - Claude 3.5 Sonnet rates
    private static final double INPUT_TOKEN_RATE = 0.003; // $0.003/1K
    private static final double OUTPUT_TOKEN_RATE = 0.015; // $0.015/1K

    // Tier included limits (monthly)
    private static final Map<String, Long> TIER_LIMITS = Map.of(
            "free", 0L, // No AI access
            "general", 50_000L, // 50K tokens/month included
            "pro", 200_000L, // 200K tokens/month included
            "phd", 1_000_000L // 1M tokens/month included, then metered
    );

    private static final String REDIS_KEY_PREFIX = "usage:tokens:";

    /**
     * Track token usage for a user. Called after each AI request.
     */
    public void trackUsage(Long userId, int inputTokens, int outputTokens) {
        String key = REDIS_KEY_PREFIX + userId;
        String billingPeriod = getCurrentBillingPeriod();

        // Use hash to store multiple fields
        redisTemplate.opsForHash().increment(key, "input", inputTokens);
        redisTemplate.opsForHash().increment(key, "output", outputTokens);
        redisTemplate.opsForHash().increment(key, "requests", 1);
        redisTemplate.opsForHash().put(key, "period", billingPeriod);

        // Set TTL to end of billing period + buffer (35 days)
        redisTemplate.expire(key, java.time.Duration.ofDays(35));

        log.debug("Tracked {} input, {} output tokens for user {}",
                inputTokens, outputTokens, userId);
    }

    /**
     * Check if user has exceeded their tier limit.
     */
    public TokenQuota checkQuota(Long userId) {
        String tier = subscriptionRepo.getTierByUserId(userId);
        if (tier == null)
            tier = "free";

        long limit = TIER_LIMITS.getOrDefault(tier, 0L);

        String key = REDIS_KEY_PREFIX + userId;
        Long inputUsed = getLongFromHash(key, "input");
        Long outputUsed = getLongFromHash(key, "output");

        long totalUsed = inputUsed + outputUsed;

        return TokenQuota.builder()
                .tier(tier)
                .limit(limit)
                .used(totalUsed)
                .remaining(Math.max(0, limit - totalUsed))
                .overageTokens(Math.max(0, totalUsed - limit))
                .inputUsed(inputUsed)
                .outputUsed(outputUsed)
                .estimatedCost(calculateCost(inputUsed, outputUsed))
                .build();
    }

    /**
     * Check if user can make AI request (has remaining quota).
     */
    public boolean canMakeRequest(Long userId, int estimatedTokens) {
        TokenQuota quota = checkQuota(userId);

        // Free tier has no AI access
        if ("free".equals(quota.getTier())) {
            return false;
        }

        // PhD tier has metered billing, always allow
        if ("phd".equals(quota.getTier())) {
            return true;
        }

        // General/Pro: check remaining quota
        return quota.getRemaining() >= estimatedTokens;
    }

    /**
     * Sync usage to Stripe every 5 minutes.
     * Only syncs overage for PhD tier (metered billing).
     */
    @Scheduled(fixedRate = 300_000) // 5 minutes
    public void syncUsageToStripe() {
        log.info("Starting Stripe usage sync...");

        Set<String> keys = redisTemplate.keys(REDIS_KEY_PREFIX + "*");
        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            try {
                String userIdStr = key.replace(REDIS_KEY_PREFIX, "");
                Long userId = Long.parseLong(userIdStr);

                TokenQuota quota = checkQuota(userId);

                // Only bill overage for PhD tier
                if (!"phd".equals(quota.getTier()) || quota.getOverageTokens() <= 0) {
                    continue;
                }

                // Get Stripe subscription item ID
                var subscription = subscriptionRepo.findByUserId(userId);
                if (subscription.isEmpty() || subscription.get().getStripeSubscriptionItemId() == null) {
                    log.warn("No metered subscription item for user {}", userId);
                    continue;
                }

                String subscriptionItemId = subscription.get().getStripeSubscriptionItemId();

                // Get previously synced overage
                Long previouslySynced = getLongFromHash(key, "synced_overage");
                long newOverage = quota.getOverageTokens() - previouslySynced;

                if (newOverage <= 0) {
                    continue;
                }

                // Calculate billable units (per 1K tokens)
                long billableUnits = newOverage / 1000;

                if (billableUnits > 0) {
                    // Create usage record in Stripe
                    UsageRecordCreateOnSubscriptionItemParams params = UsageRecordCreateOnSubscriptionItemParams
                            .builder()
                            .setQuantity(billableUnits)
                            .setTimestamp(Instant.now().getEpochSecond())
                            .setAction(UsageRecordCreateOnSubscriptionItemParams.Action.INCREMENT)
                            .build();

                    UsageRecord record = UsageRecord.createOnSubscriptionItem(
                            subscriptionItemId, params, null);

                    log.info("Synced {} token units to Stripe for user {}, record: {}",
                            billableUnits, userId, record.getId());

                    // Update synced overage counter
                    redisTemplate.opsForHash().put(key, "synced_overage", quota.getOverageTokens());
                }

            } catch (Exception e) {
                log.error("Failed to sync usage for key {}: {}", key, e.getMessage());
            }
        }
    }

    /**
     * Monthly reset job - runs on 1st of each month at midnight.
     */
    @Scheduled(cron = "0 0 0 1 * *")
    public void monthlyReset() {
        Set<String> keys = redisTemplate.keys(REDIS_KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("Reset {} user token counters for new billing period", keys.size());
        }
    }

    /**
     * Get usage summary for user dashboard.
     */
    public Map<String, Object> getUsageSummary(Long userId) {
        TokenQuota quota = checkQuota(userId);

        Map<String, Object> summary = new HashMap<>();
        summary.put("tier", quota.getTier());
        summary.put("limit", quota.getLimit());
        summary.put("used", quota.getUsed());
        summary.put("remaining", quota.getRemaining());
        summary.put("percentUsed", quota.getLimit() > 0
                ? (quota.getUsed() * 100.0 / quota.getLimit())
                : 0);
        summary.put("inputTokens", quota.getInputUsed());
        summary.put("outputTokens", quota.getOutputUsed());
        summary.put("estimatedCost", String.format("$%.4f", quota.getEstimatedCost()));
        summary.put("billingPeriod", getCurrentBillingPeriod());

        return summary;
    }

    // Helper methods

    private Long getLongFromHash(String key, String field) {
        Object value = redisTemplate.opsForHash().get(key, field);
        if (value == null)
            return 0L;
        if (value instanceof Long)
            return (Long) value;
        if (value instanceof Integer)
            return ((Integer) value).longValue();
        if (value instanceof String)
            return Long.parseLong((String) value);
        return 0L;
    }

    private String getCurrentBillingPeriod() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    private double calculateCost(long inputTokens, long outputTokens) {
        return (inputTokens / 1000.0 * INPUT_TOKEN_RATE) +
                (outputTokens / 1000.0 * OUTPUT_TOKEN_RATE);
    }

    @lombok.Data
    @lombok.Builder
    public static class TokenQuota {
        private String tier;
        private long limit;
        private long used;
        private long remaining;
        private long overageTokens;
        private long inputUsed;
        private long outputUsed;
        private double estimatedCost;
    }
}
