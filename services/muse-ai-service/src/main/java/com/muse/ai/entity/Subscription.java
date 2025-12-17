package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Subscription entity for user subscription management
 */
@Entity
@Table(name = "subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plan_id", length = 50)
    private String planId; // 'student_monthly', 'pro_monthly', etc.

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String plan = "free"; // Legacy: 'free', 'pro', 'pro_plus', 'enterprise'

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // 'ACTIVE', 'CANCELLED', 'EXPIRED', 'SUPERSEDED'

    @Column(name = "external_subscription_id")
    private String externalSubscriptionId; // Razorpay subscription ID

    @Column(name = "payment_id")
    private String paymentId;

    @Column
    private Long amount; // Amount paid in paise

    @Column(name = "monthly_credits")
    @Builder.Default
    private Integer monthlyCredits = 0;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

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

    public boolean isActive() {
        if (!"ACTIVE".equals(status) && !"active".equals(status))
            return false;
        if (endDate == null)
            return true; // Free plan
        return LocalDateTime.now().isBefore(endDate);
    }

    public boolean isUnlimited() {
        return "pro_plus".equals(plan) || "enterprise".equals(plan) ||
                (planId != null && (planId.contains("pro") || planId.contains("institution")));
    }

    public boolean isPaid() {
        return !"free".equals(plan) && (planId == null || !planId.equals("free"));
    }

    // Plan details
    public static int getMonthlyCredits(String plan) {
        return switch (plan) {
            case "pro", "student_monthly", "student_yearly" -> 5000;
            case "pro_plus", "pro_monthly", "pro_yearly", "enterprise", "institution_monthly" -> -1; // -1 = unlimited
            default -> 0;
        };
    }

    public static int getPriceInPaise(String plan) {
        return switch (plan) {
            case "student_monthly" -> 9900;
            case "student_yearly" -> 99900;
            case "pro", "pro_monthly" -> 29900;
            case "pro_yearly" -> 299900;
            case "pro_plus" -> 49900;
            case "enterprise", "institution_monthly" -> 199900;
            default -> 0;
        };
    }

    public static String getPlanDisplayName(String plan) {
        return switch (plan) {
            case "student_monthly", "student_yearly" -> "Student";
            case "pro", "pro_monthly", "pro_yearly" -> "Pro";
            case "pro_plus" -> "Pro+";
            case "enterprise", "institution_monthly" -> "Enterprise";
            default -> "Free";
        };
    }
}
