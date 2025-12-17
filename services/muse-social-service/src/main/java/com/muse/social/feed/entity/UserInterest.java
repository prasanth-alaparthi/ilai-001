package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_interests", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "interest_type", "interest_value"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String interestType; // e.g., "TAG", "POST_SEMANTIC", "USER_FOLLOW"

    @Column(nullable = false)
    private String interestValue; // e.g., "microservices", "embedding_vector_as_string", "followed_user_id"

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
