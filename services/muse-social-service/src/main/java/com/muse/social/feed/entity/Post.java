package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_avatar")
    private String authorAvatar;

    @Column(name = "author_credentials")
    private String authorCredentials;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag")
    private List<String> tags;

    // Hashtags for NeuroFeed discovery
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_hashtags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "hashtag")
    private List<String> hashtags;

    // Group context
    @Column(name = "group_id")
    private UUID groupId;

    // Visibility settings
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Visibility visibility = Visibility.PUBLIC;

    // Content classification
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type")
    @Builder.Default
    private ContentType contentType = ContentType.INSIGHT;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    @Builder.Default
    private DifficultyLevel difficultyLevel = DifficultyLevel.MEDIUM;

    @Column(name = "estimated_read_seconds")
    @Builder.Default
    private Integer estimatedReadSeconds = 60;

    // Engagement counters
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "like_count")
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "comment_count")
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "save_count")
    @Builder.Default
    private Integer saveCount = 0;

    @Column(name = "share_count")
    @Builder.Default
    private Integer shareCount = 0;

    // Algorithm scores
    @Column(name = "quality_score")
    @Builder.Default
    private Double qualityScore = 0.0;

    @Column(name = "trending_score")
    @Builder.Default
    private Double trendingScore = 0.0;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @JdbcTypeCode(SqlTypes.VECTOR)
    @Column(columnDefinition = "vector(768)")
    private Float[] embedding;

    @Column(columnDefinition = "TEXT")
    private String sourceUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_media", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "media_url")
    private List<String> mediaUrls;

    @Enumerated(EnumType.STRING)
    private MediaType mediaType;

    public enum MediaType {
        IMAGE, VIDEO, CAROUSEL, TEXT
    }

    public enum Visibility {
        PUBLIC, FRIENDS, GROUP, PRIVATE
    }

    public enum ContentType {
        INSIGHT, QUESTION, RESOURCE, DISCUSSION, ANNOUNCEMENT
    }

    public enum DifficultyLevel {
        BEGINNER, EASY, MEDIUM, HARD, ADVANCED
    }

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
