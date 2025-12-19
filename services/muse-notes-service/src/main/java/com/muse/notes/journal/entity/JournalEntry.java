package com.muse.notes.journal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "journal_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(columnDefinition = "TEXT")
    private String highlights;

    @Column(columnDefinition = "TEXT")
    private String challenges;

    @Column(columnDefinition = "TEXT")
    private String intentions;

    // New fields for rich text journal
    @Column
    private String title;

    @Column(columnDefinition = "TEXT")
    private String contentJson;

    @Column
    private String status; // DRAFT, SUBMITTED, PUBLISHED

    @Column
    private String courseCode;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(columnDefinition = "TEXT[]")
    private String[] tags;

    // Embedding for semantic search (maps to V28 migration)
    @Column(columnDefinition = "vector(768)")
    private float[] embedding;

    // Mood field for quick mood tracking
    @Column
    private String mood;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
