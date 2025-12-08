package com.muse.notes.journal.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "journal_submissions")
@Data
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // who wrote it (student)
    @Column(nullable = false)
    private String authorUsername;

    // journal entry id
    @Column(nullable = false)
    private Long entryId;

    @Column(nullable = false)
    private String courseCode;

    // optional class/group name
    @Column
    private String className;

    @Column(nullable = false)
    private Instant submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewStatus status;

    // teacher who reviewed
    @Column
    private String reviewerUsername;

    @Column(columnDefinition = "TEXT")
    private String reviewerComments;

    private Instant reviewedAt;
}
