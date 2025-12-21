package com.muse.social.warroom.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String subject;
    private String description;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "is_private")
    private Boolean isPrivate;

    @Column(name = "access_code")
    private String accessCode;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null)
            isActive = true;
        if (isPrivate == null)
            isPrivate = false;
        if (maxParticipants == null)
            maxParticipants = 10;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
