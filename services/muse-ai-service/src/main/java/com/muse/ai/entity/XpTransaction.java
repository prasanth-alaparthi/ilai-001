package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * XpTransaction - History of XP gains/losses
 */
@Entity
@Table(name = "xp_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XpTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "xp_amount", nullable = false)
    private Integer xpAmount;

    private String description;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    // Common event types
    public static final String EVENT_NOTE_CREATED = "note_created";
    public static final String EVENT_QUIZ_COMPLETED = "quiz_completed";
    public static final String EVENT_FLASHCARD_REVIEWED = "flashcard_reviewed";
    public static final String EVENT_STUDY_SESSION = "study_session";
    public static final String EVENT_STREAK_BONUS = "streak_bonus";
    public static final String EVENT_ACHIEVEMENT = "achievement";
    public static final String EVENT_DAILY_LOGIN = "daily_login";
    public static final String EVENT_AI_USAGE = "ai_usage";
}
