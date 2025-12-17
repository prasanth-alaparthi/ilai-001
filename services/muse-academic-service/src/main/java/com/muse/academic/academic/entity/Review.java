package com.muse.academic.academic.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long institutionId;

    @Column(nullable = false)
    private Long reviewerId; // Student or Parent ID

    @Column(nullable = false)
    private String reviewerName; // Cached name for display

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TargetType targetType;

    @Column(nullable = false)
    private String targetName; // Teacher name or Department name

    @Column(nullable = false)
    private Double rating; // 1.0 to 5.0

    @Column(length = 1000)
    private String comment;

    @Column(nullable = false)
    private Instant createdAt;

    public enum TargetType {
        TEACHER,
        DEPARTMENT,
        INSTITUTION
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
