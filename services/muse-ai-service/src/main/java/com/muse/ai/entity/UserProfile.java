package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "learning_style", length = 20)
    private String learningStyle; // 'visual', 'auditory', 'kinesthetic', 'reading'

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "study_preferences", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> studyPreferences = Map.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "topic_interests", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Integer> topicInterests = Map.of(); // {"physics": 85, "math": 60}

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skill_levels", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Double> skillLevels = Map.of(); // {"algebra": 0.8, "calculus": 0.4}

    @Column(name = "recent_topics", columnDefinition = "TEXT[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] recentTopics;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "module_usage", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Integer> moduleUsage = Map.of(); // {"notes": 150, "feed": 80}

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_settings", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> aiSettings = Map.of();

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
