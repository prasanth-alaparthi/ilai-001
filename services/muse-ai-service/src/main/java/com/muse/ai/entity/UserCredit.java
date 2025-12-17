package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_credits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private Integer balance = 1000;

    @Column(name = "total_earned", nullable = false)
    @Builder.Default
    private Integer totalEarned = 1000;

    @Column(name = "total_spent", nullable = false)
    @Builder.Default
    private Integer totalSpent = 0;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean hasEnoughCredits(int required) {
        return this.balance >= required;
    }

    public void deduct(int amount) {
        this.balance -= amount;
        this.totalSpent += amount;
    }

    public void add(int amount) {
        this.balance += amount;
        this.totalEarned += amount;
    }
}
