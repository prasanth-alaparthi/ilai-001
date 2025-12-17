package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * UserAchievement - Junction table for achievements earned by users
 */
@Entity
@Table(name = "user_achievements", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "achievement_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "achievement_id")
    private Achievement achievement;

    @Column(name = "earned_at")
    private Instant earnedAt;

    @PrePersist
    void onCreate() {
        this.earnedAt = Instant.now();
    }
}
