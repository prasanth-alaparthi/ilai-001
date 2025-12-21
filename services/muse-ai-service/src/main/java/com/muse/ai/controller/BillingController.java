package com.muse.ai.controller;

import com.muse.ai.entity.PaymentRequest;
import com.muse.ai.service.CreditService;
import com.muse.ai.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final CreditService creditService;
    private final SubscriptionService subscriptionService;

    // ============ CREDITS ============

    @GetMapping("/credits")
    public ResponseEntity<Map<String, Object>> getCredits(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(creditService.getCreditInfo(userId));
    }

    @GetMapping("/credits/history")
    public ResponseEntity<?> getCreditHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(creditService.getTransactionHistory(userId, page, size));
    }

    // ============ SUBSCRIPTION ============

    @GetMapping("/subscription")
    public ResponseEntity<Map<String, Object>> getSubscription(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(subscriptionService.getSubscriptionInfo(userId));
    }

    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlans());
    }

    // ============ PAYMENT ============

    @GetMapping("/payment/{plan}")
    public ResponseEntity<Map<String, Object>> getPaymentInfo(@PathVariable String plan) {
        return ResponseEntity.ok(subscriptionService.getPaymentInfo(plan));
    }

    @PostMapping("/payment/request")
    public ResponseEntity<?> createPaymentRequest(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        Long userId = Long.parseLong(jwt.getSubject());
        String plan = body.get("plan");
        String transactionId = body.get("transactionId");

        try {
            PaymentRequest request = subscriptionService.createPaymentRequest(userId, plan, transactionId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment submitted. We'll verify and activate your subscription within 24 hours.",
                    "requestId", request.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/payment/history")
    public ResponseEntity<List<PaymentRequest>> getPaymentHistory(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(subscriptionService.getUserPayments(userId));
    }

    // ============ ADMIN ENDPOINTS ============

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SCOPE_admin')")
    public ResponseEntity<Page<PaymentRequest>> getPendingPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(subscriptionService.getPendingPayments(page, size));
    }

    @PostMapping("/admin/approve/{paymentId}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SCOPE_admin')")
    public ResponseEntity<?> approvePayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal Jwt jwt) {
        Long adminId = Long.parseLong(jwt.getSubject());
        try {
            subscriptionService.approvePayment(paymentId, adminId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Payment approved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/admin/reject/{paymentId}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SCOPE_admin')")
    public ResponseEntity<?> rejectPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        Long adminId = Long.parseLong(jwt.getSubject());
        String reason = body.getOrDefault("reason", "Payment verification failed");
        try {
            subscriptionService.rejectPayment(paymentId, adminId, reason);
            return ResponseEntity.ok(Map.of("success", true, "message", "Payment rejected"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
