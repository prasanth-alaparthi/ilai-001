package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PaymentRequest entity for Razorpay payment tracking
 */
@Entity
@Table(name = "payment_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_id", unique = true)
    private String orderId;

    @Column(name = "payment_id")
    private String paymentId;

    @Column
    private String signature;

    @Column(name = "plan_id", length = 50)
    private String planId;

    @Column(nullable = false, length = 50)
    private String plan; // Legacy: 'pro', 'pro_plus', 'enterprise'

    @Column(nullable = false)
    private Long amount; // in paise (₹199 = 19900)

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "transaction_id")
    private String transactionId; // UPI transaction ID entered by user

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "CREATED"; // 'CREATED', 'PAID', 'CAPTURED', 'FAILED', 'REFUNDED'

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isPending() {
        return "CREATED".equals(status) || "pending".equals(status);
    }

    public boolean isPaid() {
        return "PAID".equals(status) || "CAPTURED".equals(status) || "approved".equals(status);
    }

    public int getAmountInRupees() {
        return (int) (amount / 100);
    }
}
