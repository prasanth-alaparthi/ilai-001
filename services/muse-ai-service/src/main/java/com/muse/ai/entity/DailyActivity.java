package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DailyActivity - Tracks daily activity for streak calculation
 */
@Entity
@Table(name = "daily_activity", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "activity_date" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "xp_earned")
    @Builder.Default
    private Integer xpEarned = 0;

    @Column(name = "study_minutes")
    @Builder.Default
    private Integer studyMinutes = 0;

    @Column(name = "notes_created")
    @Builder.Default
    private Integer notesCreated = 0;

    @Column(name = "quizzes_completed")
    @Builder.Default
    private Integer quizzesCompleted = 0;

    @Column(name = "flashcards_reviewed")
    @Builder.Default
    private Integer flashcardsReviewed = 0;
}
