package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "feed_post_likes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_post_like_post_user",
                columnNames = {"post_id", "username"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostLike {

@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

@Column(nullable = false, length = 64)
    private String username;

@Column(nullable = false)
    private Instant createdAt;
}
