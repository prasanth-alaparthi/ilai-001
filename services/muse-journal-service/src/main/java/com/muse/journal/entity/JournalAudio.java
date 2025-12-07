package com.muse.journal.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "journal_audio")
@Data
public class JournalAudio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "journal_id")
    private Long journalId;

    private String username;
    private String filename;
    private String filepath;
    private String audioUrl;
    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String transcription;

    private Instant createdAt = Instant.now();

    // Explicit setters added to resolve "cannot find symbol" errors
    public void setJournalId(Long journalId) {
        this.journalId = journalId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public void setFilepath(String filepath) {
        this.filepath = filepath;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public void setTranscription(String transcription) {
        this.transcription = transcription;
    }
}
