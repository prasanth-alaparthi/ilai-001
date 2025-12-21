package com.muse.social.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * User subscription and billing profile.
 * Links to Stripe customer and subscription IDs.
 */
@Entity
@Table(name = "user_subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "stripe_subscription_item_id")
    private String stripeSubscriptionItemId; // For metered billing

    @Column(name = "tier", nullable = false)
    @Builder.Default
    private String tier = "free"; // free | general | pro | phd

    @Column(name = "status")
    @Builder.Default
    private String status = "active"; // active | past_due | canceled

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
