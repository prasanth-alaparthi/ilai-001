package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Follow relationship (one-way)
 */
@Entity
@Table(name = "user_follows")
@IdClass(UserFollowId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFollow {

    @Id
    @Column(name = "follower_id")
    private String followerId;

    @Id
    @Column(name = "following_id")
    private String followingId;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
