package com.muse.journal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "journal_transcripts")
@Data
public class JournalTranscript {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "journal_id", nullable = false)
    private Long journalId;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column
    private String provider; // e.g. "stub", "google", "aws"

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
