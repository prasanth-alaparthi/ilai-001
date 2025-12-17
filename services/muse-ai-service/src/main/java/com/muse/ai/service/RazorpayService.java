package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.ai.entity.PaymentRequest;
import com.muse.ai.entity.Subscription;
import com.muse.ai.repository.PaymentRequestRepository;
import com.muse.ai.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Razorpay Payment Service - Handle payments for ILAI subscriptions
 * 
 * Features:
 * - Create payment orders
 * - Verify payment signatures
 * - Handle webhooks
 * - Manage subscriptions
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RazorpayService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final PaymentRequestRepository paymentRequestRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    private static final String RAZORPAY_API_URL = "https://api.razorpay.com/v1";

    // Plan pricing in paise (₹ * 100)
    public static final Map<String, Long> PLAN_PRICES = Map.of(
            "student_monthly", 9900L,      // ₹99/month
            "student_yearly", 99900L,      // ₹999/year
            "pro_monthly", 29900L,         // ₹299/month
            "pro_yearly", 299900L,         // ₹2999/year
            "institution_monthly", 199900L // ₹1999/month per seat
    );

    /**
     * Create a Razorpay order for payment
     */
    public Map<String, Object> createOrder(Long userId, String planId, String currency) {
        log.info("Creating order for user {} plan {}", userId, planId);

        Long amount = PLAN_PRICES.get(planId);
        if (amount == null) {
            return Map.of("success", false, "error", "Invalid plan");
        }

        try {
            // Create order in Razorpay
            Map<String, Object> orderRequest = Map.of(
                    "amount", amount,
                    "currency", currency != null ? currency : "INR",
                    "receipt", "order_" + userId + "_" + System.currentTimeMillis(),
                    "notes", Map.of("userId", userId.toString(), "planId", planId)
            );

            String response = webClient.post()
                    .uri(RAZORPAY_API_URL + "/orders")
                    .headers(h -> h.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .bodyValue(orderRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode orderResponse = objectMapper.readTree(response);
            String orderId = orderResponse.get("id").asText();

            // Save payment request
            PaymentRequest paymentRequest = new PaymentRequest();
            paymentRequest.setUserId(userId);
            paymentRequest.setOrderId(orderId);
            paymentRequest.setAmount(amount);
            paymentRequest.setCurrency(currency != null ? currency : "INR");
            paymentRequest.setPlanId(planId);
            paymentRequest.setStatus("CREATED");
            paymentRequest.setCreatedAt(LocalDateTime.now());
            paymentRequestRepository.save(paymentRequest);

            return Map.of(
                    "success", true,
                    "orderId", orderId,
                    "amount", amount,
                    "currency", currency != null ? currency : "INR",
                    "keyId", razorpayKeyId,
                    "planId", planId
            );
        } catch (Exception e) {
            log.error("Failed to create order: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Failed to create order");
        }
    }

    /**
     * Verify payment signature and activate subscription
     */
    public Map<String, Object> verifyPayment(String orderId, String paymentId, String signature) {
        log.info("Verifying payment {} for order {}", paymentId, orderId);

        try {
            // Verify signature
            String payload = orderId + "|" + paymentId;
            String expectedSignature = generateHmacSha256(payload, razorpayKeySecret);

            if (!expectedSignature.equals(signature)) {
                log.warn("Invalid payment signature for order {}", orderId);
                return Map.of("success", false, "error", "Invalid signature");
            }

            // Update payment request
            Optional<PaymentRequest> paymentRequestOpt = paymentRequestRepository.findByOrderId(orderId);
            if (paymentRequestOpt.isEmpty()) {
                return Map.of("success", false, "error", "Order not found");
            }

            PaymentRequest paymentRequest = paymentRequestOpt.get();
            paymentRequest.setPaymentId(paymentId);
            paymentRequest.setSignature(signature);
            paymentRequest.setStatus("PAID");
            paymentRequest.setUpdatedAt(LocalDateTime.now());
            paymentRequestRepository.save(paymentRequest);

            // Activate subscription
            activateSubscription(paymentRequest);

            return Map.of(
                    "success", true,
                    "message", "Payment verified successfully",
                    "planId", paymentRequest.getPlanId()
            );
        } catch (Exception e) {
            log.error("Payment verification failed: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Verification failed");
        }
    }

    /**
     * Handle Razorpay webhook events
     */
    public Map<String, Object> handleWebhook(String payload, String signature) {
        log.info("Processing Razorpay webhook");

        try {
            // Verify webhook signature
            String expectedSignature = generateHmacSha256(payload, razorpayKeySecret);
            if (!expectedSignature.equals(signature)) {
                log.warn("Invalid webhook signature");
                return Map.of("success", false, "error", "Invalid signature");
            }

            JsonNode event = objectMapper.readTree(payload);
            String eventType = event.get("event").asText();

            switch (eventType) {
                case "payment.captured" -> handlePaymentCaptured(event);
                case "payment.failed" -> handlePaymentFailed(event);
                case "subscription.cancelled" -> handleSubscriptionCancelled(event);
                case "refund.created" -> handleRefundCreated(event);
                default -> log.info("Unhandled webhook event: {}", eventType);
            }

            return Map.of("success", true);
        } catch (Exception e) {
            log.error("Webhook processing failed: {}", e.getMessage(), e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    private void handlePaymentCaptured(JsonNode event) {
        String paymentId = event.at("/payload/payment/entity/id").asText();
        String orderId = event.at("/payload/payment/entity/order_id").asText();
        log.info("Payment captured: {} for order {}", paymentId, orderId);
        
        paymentRequestRepository.findByOrderId(orderId).ifPresent(request -> {
            request.setStatus("CAPTURED");
            request.setPaymentId(paymentId);
            request.setUpdatedAt(LocalDateTime.now());
            paymentRequestRepository.save(request);
        });
    }

    private void handlePaymentFailed(JsonNode event) {
        String orderId = event.at("/payload/payment/entity/order_id").asText();
        String reason = event.at("/payload/payment/entity/error_description").asText();
        log.warn("Payment failed for order {}: {}", orderId, reason);
        
        paymentRequestRepository.findByOrderId(orderId).ifPresent(request -> {
            request.setStatus("FAILED");
            request.setUpdatedAt(LocalDateTime.now());
            paymentRequestRepository.save(request);
        });
    }

    private void handleSubscriptionCancelled(JsonNode event) {
        String subscriptionId = event.at("/payload/subscription/entity/id").asText();
        log.info("Subscription cancelled: {}", subscriptionId);
        
        subscriptionRepository.findByExternalSubscriptionId(subscriptionId).ifPresent(sub -> {
            sub.setStatus("CANCELLED");
            sub.setCancelledAt(LocalDateTime.now());
            subscriptionRepository.save(sub);
        });
    }

    private void handleRefundCreated(JsonNode event) {
        String paymentId = event.at("/payload/refund/entity/payment_id").asText();
        Long amount = event.at("/payload/refund/entity/amount").asLong();
        log.info("Refund created for payment {}: ₹{}", paymentId, amount / 100);
    }

    private void activateSubscription(PaymentRequest paymentRequest) {
        String planId = paymentRequest.getPlanId();
        boolean isYearly = planId.contains("yearly");
        
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = isYearly ? startDate.plusYears(1) : startDate.plusMonths(1);

        // Deactivate existing subscription
        subscriptionRepository.findActiveByUserId(paymentRequest.getUserId()).ifPresent(sub -> {
            sub.setStatus("SUPERSEDED");
            subscriptionRepository.save(sub);
        });

        // Create new subscription
        Subscription subscription = new Subscription();
        subscription.setUserId(paymentRequest.getUserId());
        subscription.setPlanId(planId);
        subscription.setStatus("ACTIVE");
        subscription.setStartDate(startDate);
        subscription.setEndDate(endDate);
        subscription.setPaymentId(paymentRequest.getPaymentId());
        subscription.setAmount(paymentRequest.getAmount());
        subscription.setCreatedAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        log.info("Subscription activated for user {} plan {} until {}", 
                paymentRequest.getUserId(), planId, endDate);
    }

    /**
     * Get user's current subscription
     */
    public Map<String, Object> getUserSubscription(Long userId) {
        Optional<Subscription> subscription = subscriptionRepository.findActiveByUserId(userId);
        
        if (subscription.isEmpty()) {
            return Map.of(
                    "status", "FREE",
                    "planId", "free",
                    "features", getFreeFeatures()
            );
        }

        Subscription sub = subscription.get();
        return Map.of(
                "status", sub.getStatus(),
                "planId", sub.getPlanId(),
                "startDate", sub.getStartDate().toString(),
                "endDate", sub.getEndDate().toString(),
                "features", getPlanFeatures(sub.getPlanId())
        );
    }

    private List<String> getFreeFeatures() {
        return List.of("5 notes", "Basic AI", "Limited flashcards");
    }

    private List<String> getPlanFeatures(String planId) {
        if (planId.contains("pro")) {
            return List.of("Unlimited notes", "Advanced AI", "Voice notes", "Doubt solver", "Priority support");
        } else if (planId.contains("student")) {
            return List.of("50 notes", "Standard AI", "Unlimited flashcards", "Study groups");
        } else if (planId.contains("institution")) {
            return List.of("Admin dashboard", "Analytics", "Bulk accounts", "Custom branding", "API access");
        }
        return getFreeFeatures();
    }

    /**
     * Cancel subscription
     */
    public Map<String, Object> cancelSubscription(Long userId) {
        Optional<Subscription> subscription = subscriptionRepository.findActiveByUserId(userId);
        
        if (subscription.isEmpty()) {
            return Map.of("success", false, "error", "No active subscription");
        }

        Subscription sub = subscription.get();
        sub.setStatus("CANCELLED");
        sub.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(sub);

        return Map.of(
                "success", true,
                "message", "Subscription cancelled. Access until " + sub.getEndDate()
        );
    }

    // HMAC-SHA256 signature generation
    private String generateHmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
