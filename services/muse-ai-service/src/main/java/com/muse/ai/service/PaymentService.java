package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Unified Payment Service with support for:
 * - Razorpay (Cards, Netbanking, Wallets)
 * - UPI (Google Pay, PhonePe, Paytm, BHIM)
 * - International (Stripe - future)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    private static final String RAZORPAY_API = "https://api.razorpay.com/v1";

    // Subscription Plans
    public static final Map<String, PlanDetails> PLANS = Map.of(
            "free", new PlanDetails("free", "Free", 0, "INR", "month", List.of(
                    "Basic notes", "5 AI queries/day", "Limited flashcards")),
            "student_pro_monthly", new PlanDetails("student_pro_monthly", "Student Pro", 19900, "INR", "month", List.of(
                    "Unlimited notes", "Unlimited AI", "All flashcards", "Voice notes", "Priority support")),
            "student_pro_yearly",
            new PlanDetails("student_pro_yearly", "Student Pro (Yearly)", 199900, "INR", "year", List.of(
                    "Unlimited notes", "Unlimited AI", "All flashcards", "Voice notes", "Priority support",
                    "2 months free")),
            "institution_monthly", new PlanDetails("institution_monthly", "Institution", 99900, "INR", "month", List.of(
                    "Up to 500 students", "Admin dashboard", "Analytics", "Custom branding", "Dedicated support")));

    /**
     * Create a Razorpay order for payment
     */
    public Map<String, Object> createOrder(String planId, Long userId, String paymentMethod) {
        log.info("Creating order for plan: {}, user: {}, method: {}", planId, userId, paymentMethod);

        PlanDetails plan = PLANS.get(planId);
        if (plan == null) {
            return Map.of("success", false, "error", "Invalid plan");
        }

        if (plan.amount() == 0) {
            return Map.of("success", true, "planId", planId, "isFree", true);
        }

        try {
            // Create Razorpay order
            Map<String, Object> orderRequest = new HashMap<>();
            orderRequest.put("amount", plan.amount()); // Amount in paise
            orderRequest.put("currency", plan.currency());
            orderRequest.put("receipt", "order_" + userId + "_" + System.currentTimeMillis());
            orderRequest.put("notes", Map.of(
                    "userId", String.valueOf(userId),
                    "planId", planId,
                    "paymentMethod", paymentMethod));

            // For UPI, add specific payment method config
            if ("upi".equals(paymentMethod)) {
                orderRequest.put("payment_capture", 1);
            }

            String response = webClient.post()
                    .uri(RAZORPAY_API + "/orders")
                    .headers(h -> h.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .bodyValue(orderRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode order = objectMapper.readTree(response);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("orderId", order.get("id").asText());
            result.put("amount", plan.amount());
            result.put("currency", plan.currency());
            result.put("keyId", razorpayKeyId);
            result.put("planName", plan.name());
            result.put("planId", planId);
            result.put("paymentMethod", paymentMethod);

            // UPI-specific options for Google Pay / PhonePe
            if ("upi".equals(paymentMethod) || "gpay".equals(paymentMethod) || "phonepe".equals(paymentMethod)) {
                result.put("upiEnabled", true);
                result.put("preferredUpiApp", paymentMethod);
            }

            return result;
        } catch (Exception e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Failed to create order: " + e.getMessage());
        }
    }

    /**
     * Verify payment signature after completion
     */
    public Map<String, Object> verifyPayment(String orderId, String paymentId, String signature, Long userId) {
        log.info("Verifying payment: orderId={}, paymentId={}", orderId, paymentId);

        try {
            // Verify signature
            String payload = orderId + "|" + paymentId;
            String expectedSignature = hmacSha256(payload, razorpayKeySecret);

            if (!expectedSignature.equals(signature)) {
                log.warn("Payment signature verification failed for orderId: {}", orderId);
                return Map.of("success", false, "error", "Invalid payment signature");
            }

            // Fetch payment details from Razorpay
            String response = webClient.get()
                    .uri(RAZORPAY_API + "/payments/" + paymentId)
                    .headers(h -> h.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode payment = objectMapper.readTree(response);

            String status = payment.get("status").asText();
            if (!"captured".equals(status)) {
                return Map.of("success", false, "error", "Payment not captured. Status: " + status);
            }

            String method = payment.has("method") ? payment.get("method").asText() : "unknown";
            String vpa = payment.has("vpa") ? payment.get("vpa").asText() : null;

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paymentId", paymentId);
            result.put("orderId", orderId);
            result.put("amount", payment.get("amount").asInt());
            result.put("method", method);
            result.put("status", "success");
            result.put("paidAt", LocalDateTime.now().toString());

            if (vpa != null) {
                result.put("upiId", vpa);
                // Detect app from VPA
                if (vpa.contains("@oksbi") || vpa.contains("@okaxis") || vpa.contains("@okhdfcbank")) {
                    result.put("upiApp", "Google Pay");
                } else if (vpa.contains("@ybl") || vpa.contains("@ibl")) {
                    result.put("upiApp", "PhonePe");
                } else if (vpa.contains("@paytm")) {
                    result.put("upiApp", "Paytm");
                }
            }

            return result;
        } catch (Exception e) {
            log.error("Payment verification failed: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Verification failed: " + e.getMessage());
        }
    }

    /**
     * Create UPI payment link (for deep linking to GPay/PhonePe)
     */
    public Map<String, Object> createUpiPaymentLink(String planId, Long userId, String preferredApp) {
        log.info("Creating UPI payment link for plan: {}, user: {}, app: {}", planId, userId, preferredApp);

        PlanDetails plan = PLANS.get(planId);
        if (plan == null || plan.amount() == 0) {
            return Map.of("success", false, "error", "Invalid plan");
        }

        try {
            Map<String, Object> linkRequest = new HashMap<>();
            linkRequest.put("amount", plan.amount());
            linkRequest.put("currency", plan.currency());
            linkRequest.put("accept_partial", false);
            linkRequest.put("description", "ILAI " + plan.name() + " Subscription");
            linkRequest.put("customer", Map.of(
                    "name", "ILAI User",
                    "email", "user@ilai.co.in"));
            linkRequest.put("notify", Map.of("sms", false, "email", false));
            linkRequest.put("callback_url", "https://ilai.co.in/api/payments/callback");
            linkRequest.put("callback_method", "get");

            // UPI-specific options
            linkRequest.put("upi_link", true);

            String response = webClient.post()
                    .uri(RAZORPAY_API + "/payment_links")
                    .headers(h -> h.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .bodyValue(linkRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode link = objectMapper.readTree(response);

            String shortUrl = link.get("short_url").asText();
            String upiLink = link.has("upi_link") ? link.get("upi_link").asText() : null;

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paymentLinkId", link.get("id").asText());
            result.put("shortUrl", shortUrl);
            result.put("upiLink", upiLink);
            result.put("amount", plan.amount());
            result.put("planName", plan.name());

            // Generate app-specific deep links
            if (upiLink != null) {
                result.put("gpayLink", "gpay://upi/" + extractUpiPath(upiLink));
                result.put("phonepeLink", "phonepe://pay" + extractUpiPath(upiLink));
                result.put("paytmLink", "paytmmp://upi/" + extractUpiPath(upiLink));
            }

            return result;
        } catch (Exception e) {
            log.error("Failed to create UPI payment link: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Failed to create payment link");
        }
    }

    /**
     * Get subscription plans
     */
    public List<Map<String, Object>> getPlans() {
        List<Map<String, Object>> planList = new ArrayList<>();

        for (PlanDetails plan : PLANS.values()) {
            Map<String, Object> planMap = new HashMap<>();
            planMap.put("id", plan.id());
            planMap.put("name", plan.name());
            planMap.put("amount", plan.amount());
            planMap.put("currency", plan.currency());
            planMap.put("interval", plan.interval());
            planMap.put("features", plan.features());
            planMap.put("displayPrice", formatPrice(plan.amount(), plan.currency()));
            planList.add(planMap);
        }

        return planList;
    }

    /**
     * Refund a payment
     */
    public Map<String, Object> refundPayment(String paymentId, Integer amount, String reason) {
        log.info("Processing refund for paymentId: {}, amount: {}", paymentId, amount);

        try {
            Map<String, Object> refundRequest = new HashMap<>();
            if (amount != null) {
                refundRequest.put("amount", amount);
            }
            refundRequest.put("notes", Map.of("reason", reason != null ? reason : "Customer request"));

            String response = webClient.post()
                    .uri(RAZORPAY_API + "/payments/" + paymentId + "/refund")
                    .headers(h -> h.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .bodyValue(refundRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode refund = objectMapper.readTree(response);

            return Map.of(
                    "success", true,
                    "refundId", refund.get("id").asText(),
                    "amount", refund.get("amount").asInt(),
                    "status", refund.get("status").asText());
        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Refund failed: " + e.getMessage());
        }
    }

    // Webhook handling for async payments
    public boolean handleWebhook(String payload, String signature) {
        try {
            String expectedSignature = hmacSha256(payload, razorpayKeySecret);
            if (!expectedSignature.equals(signature)) {
                log.warn("Webhook signature mismatch");
                return false;
            }

            JsonNode event = objectMapper.readTree(payload);
            String eventType = event.get("event").asText();

            log.info("Processing webhook: {}", eventType);

            switch (eventType) {
                case "payment.captured" -> handlePaymentCaptured(event);
                case "payment.failed" -> handlePaymentFailed(event);
                case "refund.created" -> handleRefundCreated(event);
                default -> log.info("Unhandled webhook event: {}", eventType);
            }

            return true;
        } catch (Exception e) {
            log.error("Webhook processing failed: {}", e.getMessage(), e);
            return false;
        }
    }

    private void handlePaymentCaptured(JsonNode event) {
        JsonNode payment = event.get("payload").get("payment").get("entity");
        String paymentId = payment.get("id").asText();
        int amount = payment.get("amount").asInt();

        log.info("Payment captured: {}, amount: {}", paymentId, amount);

        try {
            // Extract user info from payment notes
            JsonNode notes = payment.get("notes");
            if (notes != null && notes.has("userId")) {
                Long userId = Long.parseLong(notes.get("userId").asText());
                String planId = notes.has("planId") ? notes.get("planId").asText() : "student_pro_monthly";

                // Update subscription status in database
                updateUserSubscription(userId, planId, paymentId, amount);

                // Send confirmation email
                sendPaymentConfirmationEmail(userId, paymentId, amount, planId);

                log.info("Successfully processed payment for user {}, plan: {}", userId, planId);
            } else {
                log.warn("Payment {} missing user info in notes", paymentId);
            }
        } catch (Exception e) {
            log.error("Failed to process payment captured event: {}", e.getMessage(), e);
        }
    }

    private void handlePaymentFailed(JsonNode event) {
        JsonNode payment = event.get("payload").get("payment").get("entity");
        String paymentId = payment.get("id").asText();

        log.warn("Payment failed: {}", paymentId);

        try {
            // Extract failure details
            String errorCode = payment.has("error_code") ? payment.get("error_code").asText() : "unknown";
            String errorDescription = payment.has("error_description") ? payment.get("error_description").asText()
                    : "Payment processing failed";

            // Extract user info
            JsonNode notes = payment.get("notes");
            if (notes != null && notes.has("userId")) {
                Long userId = Long.parseLong(notes.get("userId").asText());
                String planId = notes.has("planId") ? notes.get("planId").asText() : "unknown";

                // Notify user about payment failure
                sendPaymentFailureNotification(userId, paymentId, errorDescription, planId);

                // Log for retry analysis
                log.info("Payment failure logged for user {}: errorCode={}, description={}",
                        userId, errorCode, errorDescription);
            }
        } catch (Exception e) {
            log.error("Failed to process payment failed event: {}", e.getMessage(), e);
        }
    }

    private void handleRefundCreated(JsonNode event) {
        JsonNode refund = event.get("payload").get("refund").get("entity");
        String refundId = refund.get("id").asText();
        String paymentId = refund.get("payment_id").asText();
        int amount = refund.get("amount").asInt();

        log.info("Refund created: {}, amount: {}", refundId, amount);

        try {
            // Update subscription status to cancelled/refunded
            // Find user by payment ID and downgrade/cancel subscription
            updateSubscriptionAfterRefund(paymentId, refundId, amount);

            log.info("Subscription updated after refund: {}", refundId);
        } catch (Exception e) {
            log.error("Failed to process refund event: {}", e.getMessage(), e);
        }
    }

    // Helper methods
    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes());
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String extractUpiPath(String upiLink) {
        return upiLink.replace("upi://", "");
    }

    private String formatPrice(int amountInPaise, String currency) {
        if ("INR".equals(currency)) {
            return "₹" + (amountInPaise / 100);
        }
        return currency + " " + (amountInPaise / 100);
    }

    // Plan details record
    public record PlanDetails(
            String id,
            String name,
            int amount,
            String currency,
            String interval,
            List<String> features) {
    }
}
