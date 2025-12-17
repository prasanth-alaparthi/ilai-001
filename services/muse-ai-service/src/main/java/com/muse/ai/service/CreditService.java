package com.muse.ai.service;

import com.muse.ai.entity.CreditTransaction;
import com.muse.ai.entity.Subscription;
import com.muse.ai.entity.UserCredit;
import com.muse.ai.repository.CreditTransactionRepository;
import com.muse.ai.repository.SubscriptionRepository;
import com.muse.ai.repository.UserCreditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class CreditService {

    private final UserCreditRepository creditRepository;
    private final CreditTransactionRepository transactionRepository;
    private final SubscriptionRepository subscriptionRepository;

    // Credit costs per feature
    public static final Map<String, Integer> CREDIT_COSTS = Map.ofEntries(
            Map.entry("ai_chat", 1),
            Map.entry("quick_answer", 1),
            Map.entry("summarize_short", 2),
            Map.entry("summarize_long", 5),
            Map.entry("explain", 3),
            Map.entry("flashcards", 5),
            Map.entry("quiz", 10),
            Map.entry("research", 20),
            Map.entry("voice_transcribe", 3),
            Map.entry("grammar", 2),
            Map.entry("writing", 5),
            Map.entry("image_analyze", 5),
            Map.entry("agent_run", 15));

    public static final int SIGNUP_BONUS = 1000;
    public static final int PRO_MONTHLY_CREDITS = 5000;

    // ==========================================
    // 🔧 BILLING FEATURE FLAG
    // Set to false to enable billing when ready
    // ==========================================
    private static final boolean BILLING_DISABLED = true;

    /**
     * Get or create user credits
     */
    public UserCredit getOrCreateCredits(Long userId) {
        return creditRepository.findByUserId(userId)
                .orElseGet(() -> initializeNewUser(userId));
    }

    /**
     * Initialize new user with signup bonus
     */
    @Transactional
    public UserCredit initializeNewUser(Long userId) {
        if (creditRepository.existsByUserId(userId)) {
            return creditRepository.findByUserId(userId).get();
        }

        UserCredit credits = UserCredit.builder()
                .userId(userId)
                .balance(SIGNUP_BONUS)
                .totalEarned(SIGNUP_BONUS)
                .totalSpent(0)
                .build();

        credits = creditRepository.save(credits);

        logTransaction(userId, SIGNUP_BONUS, credits.getBalance(),
                "signup_bonus", "Welcome bonus - " + SIGNUP_BONUS + " free credits", null, null);

        log.info("Initialized credits for user {}: {} credits", userId, SIGNUP_BONUS);
        return credits;
    }

    /**
     * Check if user has enough credits for a feature
     */
    public boolean hasCredits(Long userId, String feature) {
        // BILLING DISABLED: Always return true during testing
        if (BILLING_DISABLED) {
            log.debug("Billing disabled - allowing {} for user {}", feature, userId);
            return true;
        }

        int required = getCreditCost(feature);

        // Check if user has unlimited plan
        Subscription sub = getActiveSubscription(userId);
        if (sub != null && sub.isUnlimited()) {
            return true;
        }

        UserCredit credits = getOrCreateCredits(userId);
        return credits.hasEnoughCredits(required);
    }

    /**
     * Get credit cost for a feature
     */
    public int getCreditCost(String feature) {
        return CREDIT_COSTS.getOrDefault(feature, 1);
    }

    /**
     * Use credits for a feature - returns true if successful
     */
    @Transactional
    public boolean useCredits(Long userId, String feature, String description) {
        // BILLING DISABLED: Skip credit deduction during testing
        if (BILLING_DISABLED) {
            log.debug("Billing disabled - skipping credit deduction for {} by user {}", feature, userId);
            return true;
        }

        int cost = getCreditCost(feature);

        // Check unlimited subscription
        Subscription sub = getActiveSubscription(userId);
        if (sub != null && sub.isUnlimited()) {
            log.debug("User {} has unlimited plan, no credit deduction for {}", userId, feature);
            logUsageOnly(userId, feature, description);
            return true;
        }

        UserCredit credits = getOrCreateCredits(userId);
        if (!credits.hasEnoughCredits(cost)) {
            log.warn("User {} has insufficient credits for {} (need {}, have {})",
                    userId, feature, cost, credits.getBalance());
            return false;
        }

        // Deduct credits
        credits.deduct(cost);
        creditRepository.save(credits);

        // Log transaction
        logTransaction(userId, -cost, credits.getBalance(),
                "usage", description, feature, null);

        log.debug("Deducted {} credits from user {} for {}, balance: {}",
                cost, userId, feature, credits.getBalance());

        return true;
    }

    /**
     * Add credits to user account
     */
    @Transactional
    public void addCredits(Long userId, int amount, String type, String description, String referenceId) {
        UserCredit credits = getOrCreateCredits(userId);
        credits.add(amount);
        creditRepository.save(credits);

        logTransaction(userId, amount, credits.getBalance(), type, description, null, referenceId);
        log.info("Added {} credits to user {}, new balance: {}", amount, userId, credits.getBalance());
    }

    /**
     * Get user's current balance
     */
    public int getBalance(Long userId) {
        return getOrCreateCredits(userId).getBalance();
    }

    /**
     * Get user's credit info summary
     */
    public Map<String, Object> getCreditInfo(Long userId) {
        UserCredit credits = getOrCreateCredits(userId);
        Subscription sub = getActiveSubscription(userId);

        Map<String, Object> info = new HashMap<>();
        info.put("balance", credits.getBalance());
        info.put("totalEarned", credits.getTotalEarned());
        info.put("totalSpent", credits.getTotalSpent());
        info.put("isUnlimited", sub != null && sub.isUnlimited());
        info.put("plan", sub != null ? sub.getPlan() : "free");
        info.put("planDisplayName", sub != null ? Subscription.getPlanDisplayName(sub.getPlan()) : "Free");

        return info;
    }

    /**
     * Get transaction history
     */
    public Page<CreditTransaction> getTransactionHistory(Long userId, int page, int size) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
    }

    /**
     * Get active subscription for user
     */
    public Subscription getActiveSubscription(Long userId) {
        return subscriptionRepository.findByUserIdAndStatus(userId, "active")
                .filter(Subscription::isActive)
                .orElse(null);
    }

    /**
     * Check if user is on a paid plan
     */
    public boolean isPaidUser(Long userId) {
        Subscription sub = getActiveSubscription(userId);
        return sub != null && sub.isPaid();
    }

    /**
     * Log transaction
     */
    private void logTransaction(Long userId, int amount, int balanceAfter,
            String type, String description, String feature, String referenceId) {
        CreditTransaction tx = CreditTransaction.builder()
                .userId(userId)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .type(type)
                .description(description)
                .feature(feature)
                .referenceId(referenceId)
                .build();

        transactionRepository.save(tx);
    }

    /**
     * Log usage without deducting (for unlimited plans)
     */
    private void logUsageOnly(Long userId, String feature, String description) {
        CreditTransaction tx = CreditTransaction.builder()
                .userId(userId)
                .amount(0)
                .balanceAfter(getBalance(userId))
                .type("usage_unlimited")
                .description(description)
                .feature(feature)
                .build();

        transactionRepository.save(tx);
    }
}
