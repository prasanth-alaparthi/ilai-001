package com.muse.ai.service;

import com.muse.ai.entity.PaymentRequest;
import com.muse.ai.entity.Subscription;
import com.muse.ai.repository.PaymentRequestRepository;
import com.muse.ai.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRequestRepository paymentRepository;
    private final CreditService creditService;

    // Plan pricing in paise (₹1 = 100 paise)
    public static final Map<String, Integer> PLAN_PRICES = Map.of(
            "pro", 19900, // ₹199
            "pro_plus", 49900, // ₹499
            "enterprise", 99900 // ₹999
    );

    // Plan monthly credits (-1 = unlimited)
    public static final Map<String, Integer> PLAN_CREDITS = Map.of(
            "free", 0,
            "pro", 5000,
            "pro_plus", -1, // unlimited
            "enterprise", -1 // unlimited
    );

    // UPI Payment Details (TO BE FILLED BY ADMIN)
    public static final String UPI_ID = ""; // Fill your UPI ID here
    public static final String UPI_NAME = ""; // Fill your name here

    /**
     * Get subscription for user (creates free if not exists)
     */
    public Subscription getOrCreateSubscription(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .orElseGet(() -> createFreeSubscription(userId));
    }

    /**
     * Create free subscription for new user
     */
    @Transactional
    public Subscription createFreeSubscription(Long userId) {
        if (subscriptionRepository.existsByUserId(userId)) {
            return subscriptionRepository.findByUserId(userId).get();
        }

        Subscription sub = Subscription.builder()
                .userId(userId)
                .plan("free")
                .status("active")
                .monthlyCredits(0)
                .build();

        return subscriptionRepository.save(sub);
    }

    /**
     * Get all plan info for pricing page
     */
    public List<Map<String, Object>> getAllPlans() {
        return List.of(
                Map.of(
                        "id", "pro",
                        "name", "Pro",
                        "price", 199,
                        "credits", "5,000/month",
                        "features", List.of(
                                "5,000 AI credits per month",
                                "All AI features",
                                "Voice interface",
                                "Research Agent",
                                "Knowledge Graph",
                                "Priority support")),
                Map.of(
                        "id", "pro_plus",
                        "name", "Pro+",
                        "price", 499,
                        "credits", "Unlimited",
                        "featured", true,
                        "features", List.of(
                                "Unlimited AI usage",
                                "Everything in Pro",
                                "Advanced agents",
                                "API access",
                                "Early access to features")),
                Map.of(
                        "id", "enterprise",
                        "name", "Enterprise",
                        "price", 999,
                        "credits", "Unlimited (5 users)",
                        "features", List.of(
                                "Everything in Pro+",
                                "5 team members",
                                "Admin dashboard",
                                "Custom integrations",
                                "Dedicated support")));
    }

    /**
     * Create payment request (user initiates upgrade)
     */
    @Transactional
    public PaymentRequest createPaymentRequest(Long userId, String plan, String transactionId) {
        if (!PLAN_PRICES.containsKey(plan)) {
            throw new IllegalArgumentException("Invalid plan: " + plan);
        }

        // Check if transaction ID already used
        if (transactionId != null && paymentRepository.existsByTransactionId(transactionId)) {
            throw new IllegalArgumentException("Transaction ID already used");
        }

        PaymentRequest request = PaymentRequest.builder()
                .userId(userId)
                .plan(plan)
                .amount(PLAN_PRICES.get(plan).longValue())
                .transactionId(transactionId)
                .status("pending")
                .build();

        request = paymentRepository.save(request);
        log.info("Created payment request {} for user {} - plan: {}", request.getId(), userId, plan);

        return request;
    }

    /**
     * Get pending payment requests (for admin)
     */
    public Page<PaymentRequest> getPendingPayments(int page, int size) {
        return paymentRepository.findByStatusOrderByCreatedAtDesc("pending", PageRequest.of(page, size));
    }

    /**
     * Approve payment and activate subscription (admin action)
     */
    @Transactional
    public Subscription approvePayment(UUID paymentId, Long adminUserId) {
        PaymentRequest payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!payment.isPending()) {
            throw new IllegalArgumentException("Payment already processed");
        }

        // Update payment status
        payment.setStatus("approved");
        payment.setApprovedBy(adminUserId);
        payment.setApprovedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Activate subscription
        Subscription sub = activateSubscription(payment.getUserId(), payment.getPlan());

        log.info("Approved payment {} for user {} - activated {} plan",
                paymentId, payment.getUserId(), payment.getPlan());

        return sub;
    }

    /**
     * Reject payment (admin action)
     */
    @Transactional
    public void rejectPayment(UUID paymentId, Long adminUserId, String reason) {
        PaymentRequest payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!payment.isPending()) {
            throw new IllegalArgumentException("Payment already processed");
        }

        payment.setStatus("rejected");
        payment.setApprovedBy(adminUserId);
        payment.setRejectedAt(LocalDateTime.now());
        payment.setAdminNotes(reason);
        paymentRepository.save(payment);

        log.info("Rejected payment {} for user {}: {}", paymentId, payment.getUserId(), reason);
    }

    /**
     * Activate a subscription plan
     */
    @Transactional
    public Subscription activateSubscription(Long userId, String plan) {
        Subscription sub = getOrCreateSubscription(userId);

        sub.setPlan(plan);
        sub.setStatus("active");
        sub.setMonthlyCredits(PLAN_CREDITS.getOrDefault(plan, 0));
        sub.setCurrentPeriodStart(LocalDateTime.now());
        sub.setCurrentPeriodEnd(LocalDateTime.now().plusDays(30));

        sub = subscriptionRepository.save(sub);

        // Add monthly credits if pro plan
        if ("pro".equals(plan)) {
            creditService.addCredits(userId, 5000, "subscription_credit",
                    "Pro subscription - 5000 monthly credits", sub.getId().toString());
        }

        log.info("Activated {} subscription for user {}", plan, userId);
        return sub;
    }

    /**
     * Cancel subscription
     */
    @Transactional
    public void cancelSubscription(Long userId) {
        Subscription sub = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found"));

        sub.setStatus("cancelled");
        subscriptionRepository.save(sub);

        log.info("Cancelled subscription for user {}", userId);
    }

    /**
     * Get user's payment history
     */
    public List<PaymentRequest> getUserPayments(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get subscription info for display
     */
    public Map<String, Object> getSubscriptionInfo(Long userId) {
        Subscription sub = getOrCreateSubscription(userId);
        Map<String, Object> info = new HashMap<>();

        info.put("plan", sub.getPlan());
        info.put("planName", Subscription.getPlanDisplayName(sub.getPlan()));
        info.put("status", sub.getStatus());
        info.put("isActive", sub.isActive());
        info.put("isPaid", sub.isPaid());
        info.put("isUnlimited", sub.isUnlimited());
        info.put("periodEnd", sub.getCurrentPeriodEnd());
        info.put("monthlyCredits", sub.getMonthlyCredits());

        return info;
    }

    /**
     * Get payment info (UPI details) for checkout
     */
    public Map<String, Object> getPaymentInfo(String plan) {
        if (!PLAN_PRICES.containsKey(plan)) {
            throw new IllegalArgumentException("Invalid plan: " + plan);
        }

        Map<String, Object> info = new HashMap<>();
        info.put("plan", plan);
        info.put("planName", Subscription.getPlanDisplayName(plan));
        info.put("amount", PLAN_PRICES.get(plan) / 100); // in rupees
        info.put("upiId", UPI_ID);
        info.put("upiName", UPI_NAME);

        return info;
    }

    /**
     * Check and expire old subscriptions (run as scheduled job)
     */
    @Transactional
    public void expireOldSubscriptions() {
        List<Subscription> expired = subscriptionRepository
                .findByStatusAndCurrentPeriodEndBefore("active", LocalDateTime.now());

        for (Subscription sub : expired) {
            if (sub.isPaid()) {
                sub.setStatus("expired");
                sub.setPlan("free");
                subscriptionRepository.save(sub);
                log.info("Expired subscription for user {}", sub.getUserId());
            }
        }
    }
}
