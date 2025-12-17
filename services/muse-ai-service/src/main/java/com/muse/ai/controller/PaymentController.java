package com.muse.ai.controller;

import com.muse.ai.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Payment Controller - Razorpay, UPI (GPay, PhonePe) payments
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Get available subscription plans
     */
    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getPlans() {
        return ResponseEntity.ok(paymentService.getPlans());
    }

    /**
     * Create order for payment
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> request) {
        String planId = (String) request.get("planId");
        Long userId = request.get("userId") != null ? ((Number) request.get("userId")).longValue() : null;
        String paymentMethod = (String) request.getOrDefault("paymentMethod", "card");

        if (planId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan ID is required"));
        }

        Map<String, Object> result = paymentService.createOrder(planId, userId, paymentMethod);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Create UPI payment link for deep linking
     */
    @PostMapping("/upi-link")
    public ResponseEntity<Map<String, Object>> createUpiLink(@RequestBody Map<String, Object> request) {
        String planId = (String) request.get("planId");
        Long userId = request.get("userId") != null ? ((Number) request.get("userId")).longValue() : null;
        String preferredApp = (String) request.getOrDefault("preferredApp", "gpay");

        if (planId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan ID is required"));
        }

        Map<String, Object> result = paymentService.createUpiPaymentLink(planId, userId, preferredApp);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Verify payment after completion
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody Map<String, String> request) {
        String orderId = request.get("orderId");
        String paymentId = request.get("paymentId");
        String signature = request.get("signature");
        Long userId = request.get("userId") != null ? Long.valueOf(request.get("userId")) : null;

        if (orderId == null || paymentId == null || signature == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Order ID, Payment ID and Signature are required"));
        }

        Map<String, Object> result = paymentService.verifyPayment(orderId, paymentId, signature, userId);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Process refund
     */
    @PostMapping("/refund")
    public ResponseEntity<Map<String, Object>> refundPayment(@RequestBody Map<String, Object> request) {
        String paymentId = (String) request.get("paymentId");
        Integer amount = request.get("amount") != null ? ((Number) request.get("amount")).intValue() : null;
        String reason = (String) request.get("reason");

        if (paymentId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment ID is required"));
        }

        Map<String, Object> result = paymentService.refundPayment(paymentId, amount, reason);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Razorpay webhook endpoint
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        boolean success = paymentService.handleWebhook(payload, signature);

        if (success) {
            return ResponseEntity.ok("OK");
        } else {
            return ResponseEntity.badRequest().body("Webhook verification failed");
        }
    }

    /**
     * Payment callback (for redirect after payment)
     */
    @GetMapping("/callback")
    public ResponseEntity<String> paymentCallback(
            @RequestParam(required = false) String razorpay_payment_id,
            @RequestParam(required = false) String razorpay_payment_link_id,
            @RequestParam(required = false) String razorpay_payment_link_status) {

        log.info("Payment callback: paymentId={}, linkId={}, status={}",
                razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_status);

        // Redirect to frontend success/failure page
        if ("paid".equals(razorpay_payment_link_status)) {
            return ResponseEntity.status(302)
                    .header("Location", "/payment-success?paymentId=" + razorpay_payment_id)
                    .build();
        } else {
            return ResponseEntity.status(302)
                    .header("Location", "/payment-failed")
                    .build();
        }
    }
}
