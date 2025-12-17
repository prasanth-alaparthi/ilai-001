package com.muse.academic.academic.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "exam_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false)
    private Long studentId;

    private Double marksObtained;
    private Double totalMarks;
    private String remarks;

    @Column(nullable = false)
    private Instant gradedAt;

    @PrePersist
    void onCreate() {
        this.gradedAt = Instant.now();
    }
}
