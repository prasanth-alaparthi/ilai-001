package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credit_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Integer amount; // positive = earned, negative = spent

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(nullable = false, length = 50)
    private String type; // 'signup_bonus', 'usage', 'subscription_credit', 'refund', 'admin_grant'

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String feature; // 'ai_chat', 'summarize', 'flashcards', etc.

    @Column(name = "reference_id")
    private String referenceId; // subscription_id, payment_id, etc.

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
