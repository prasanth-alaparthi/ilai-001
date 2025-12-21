package com.muse.social.domain.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * UserSubscription Entity - DDD Domain Layer.
 * 
 * Tracks user's Stripe subscription for tier-based access.
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

    @Column(name = "stripe_customer_id", length = 100)
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id", length = 100)
    private String stripeSubscriptionId;

    @Column(name = "stripe_subscription_item_id", length = 100)
    private String stripeSubscriptionItemId;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String tier = "free"; // free | general | pro | phd

    @Column(length = 20)
    @Builder.Default
    private String status = "active"; // active | canceled | past_due

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
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
