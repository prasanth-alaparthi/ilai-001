package com.muse.auth.feed.entity;

import com.muse.auth.feed.PostStatus;
import com.muse.auth.feed.PostVisibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "feed_posts",
    indexes = {
        @Index(name = "idx_feed_posts_created_at", columnList = "createdAt"),
        @Index(name = "idx_feed_posts_author", columnList = "authorUsername"),
        @Index(name = "idx_feed_posts_visibility_status", columnList = "visibility,status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

@Column(nullable = false, length = 64)
    private String authorUsername;

@Column(columnDefinition = "TEXT")
    private String contentText;

@Column(length = 8)
    private String language; // ISO code

@Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PostVisibility visibility;

// NEW – study-related moderation
    @Enumerated(EnumType.STRING)
    @Column(nullable =false, length = 16)
    private PostStatus status;

// optional subject hint like "math", "physics" etc.
    @Column(length = 64)
    private String subjectTag;

// if blocked or pending
    @Column(length = 255)
    private String blockedReason;

// flagged for age issues
    @Column(nullable = false)
    private boolean ageFlagged;

@Column(nullable = false)
    private Instant createdAt;

@Column(nullable = false)
    private Instant updatedAt;

@OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostMedia> mediaList = new ArrayList<>();
}
