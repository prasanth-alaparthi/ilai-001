package com.muse.academic.academic.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "club_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime eventDate;

    @Column
    private String location; // Can be physical location or "Online"

    @Column
    private String meetingLink; // For online events

    @Column(nullable = false)
    @Builder.Default
    private String eventType = "MEETING"; // MEETING, WORKSHOP, COMPETITION, SOCIAL, OTHER

    @Column(nullable = false)
    private Long creatorId;

    @Column(nullable = false)
    @Builder.Default
    private Integer rsvpCount = 0;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
