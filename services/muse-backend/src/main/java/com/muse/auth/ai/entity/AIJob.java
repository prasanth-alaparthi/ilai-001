package com.muse.auth.ai.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "ai_jobs")
@Data
public class AIJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // embedding, summary
    private String sourceTable; // journals, notes
    private Long sourceId;

    @Column(columnDefinition = "TEXT")
    private String payload; // json

    private String status; // queued, running, success, failed
    private Integer attempts = 0;

    @Column(columnDefinition = "TEXT")
    private String result;

    private Instant createdAt = Instant.now();
}
