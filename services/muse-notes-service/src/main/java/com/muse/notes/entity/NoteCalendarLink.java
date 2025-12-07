package com.muse.notes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "note_calendar_links")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteCalendarLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(nullable = false)
    private String calendarEventId; // ID of the event in the external calendar

    @Column(nullable = false)
    private String calendarProvider; // e.g., "GOOGLE", "OUTLOOK"

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
