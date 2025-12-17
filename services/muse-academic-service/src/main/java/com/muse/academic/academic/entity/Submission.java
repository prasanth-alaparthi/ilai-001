package com.muse.academic.academic.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false)
    private Long studentId;

    @Column(columnDefinition = "TEXT")
    private String content; // Could be a link or text

    private Double grade;
    private String feedback;

    @Column(nullable = false)
    private Instant submittedAt;

    @PrePersist
    void onCreate() {
        this.submittedAt = Instant.now();
    }
}
