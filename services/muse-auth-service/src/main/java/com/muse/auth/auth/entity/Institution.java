package com.muse.auth.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "institutions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String type; // SCHOOL, COLLEGE, UNIVERSITY

    private String address;
    private String contactEmail;
    private String contactPhone;

    @Column(nullable = false)
    private boolean isVerified;

    @Column(nullable = false)
    private boolean hasActiveSubscription;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (!this.isVerified) {
            this.isVerified = false;
        }
        this.hasActiveSubscription = true; // Default to TRUE for testing
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
