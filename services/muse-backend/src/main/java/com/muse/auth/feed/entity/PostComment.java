package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "feed_post_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostComment {

@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private PostComment parent; // replies, can be null

@Column(nullable = false, length = 64)
    private String authorUsername;

@Column(columnDefinition = "TEXT", nullable = false)
    private String text;

@Column(length = 8)
    private String language;

@Column(nullable = false)
    private Instant createdAt;

@Column(nullable = false)
    private Instant updatedAt;
}