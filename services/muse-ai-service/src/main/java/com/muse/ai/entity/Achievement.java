package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Achievement - Catalog of available achievements
 */
@Entity
@Table(name = "achievements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @Column(length = 50)
    private String icon;

    @Column(name = "xp_reward")
    @Builder.Default
    private Integer xpReward = 0;

    @Column(length = 20)
    @Builder.Default
    private String tier = "bronze"; // bronze, silver, gold, platinum

    @Column(length = 50)
    private String category; // notes, study, social, streak, special

    @Column(name = "requirement_type", length = 50)
    private String requirementType; // count, streak, special

    @Column(name = "requirement_count")
    @Builder.Default
    private Integer requirementCount = 1;

    @Column(name = "is_hidden")
    @Builder.Default
    private Boolean isHidden = false;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    /**
     * Get tier color for UI
     */
    public String getTierColor() {
        return switch (this.tier) {
            case "silver" -> "#C0C0C0";
            case "gold" -> "#FFD700";
            case "platinum" -> "#E5E4E2";
            default -> "#CD7F32"; // bronze
        };
    }
}
