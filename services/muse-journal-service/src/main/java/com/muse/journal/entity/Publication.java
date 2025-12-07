package com.muse.journal.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "journal_publications")
@Data
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long entryId;

    @Column(nullable = false)
    private Long submissionId;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String publishedByUsername;

    @Column(nullable = false)
    private Instant publishedAt;

    // Optional tags for filtering (comma-separated)
    @Column
    private String tags;
}
