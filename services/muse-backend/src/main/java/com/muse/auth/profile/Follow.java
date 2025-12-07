// File: auth-service/src/main/java/com/muse/auth/profile/Follow.java
package com.muse.auth.profile;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "follows", uniqueConstraints = {@UniqueConstraint(columnNames = {"follower_username","followee_username"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_username", nullable = false, length = 64)
    private String followerUsername;

    @Column(name = "followee_username", nullable = false, length = 64)
    private String followeeUsername;

    @Column(nullable = false, length = 16)
    private String status; // ACTIVE / PENDING

    @Column(name = "created_at")
    private Instant createdAt;
}