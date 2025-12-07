package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "feed_post_shares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostShare {

@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

@Column(nullable = false, length = 64)
    private String sharedByUsername;

@Column(columnDefinition = "TEXT")
    private String message;

@Column(nullable = false)
    private Instant createdAt;
}

 