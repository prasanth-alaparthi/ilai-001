package com.muse.social.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tracks token usage for AI features.
 * Aggregated per billing period for Stripe metered billing.
 */
@Entity
@Table(name = "token_usage", indexes = {
        @Index(name = "idx_token_usage_user_period", columnList = "user_id, billing_period")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "billing_period", nullable = false)
    private String billingPeriod; // Format: YYYY-MM

    @Column(name = "input_tokens")
    @Builder.Default
    private Long inputTokens = 0L;

    @Column(name = "output_tokens")
    @Builder.Default
    private Long outputTokens = 0L;

    @Column(name = "total_tokens")
    @Builder.Default
    private Long totalTokens = 0L;

    @Column(name = "request_count")
    @Builder.Default
    private Integer requestCount = 0;

    @Column(name = "synced_to_stripe")
    @Builder.Default
    private Boolean syncedToStripe = false;

    @Column(name = "stripe_usage_record_id")
    private String stripeUsageRecordId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.totalTokens = this.inputTokens + this.outputTokens;
    }
}
