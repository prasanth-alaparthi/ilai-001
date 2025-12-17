package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * User profile with credentials
 */
@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedUserProfile {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(length = 500)
    private String bio;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    // Credentials
    @Column(length = 255)
    private String credentials;

    @Column(length = 255)
    private String institution;

    @Column(name = "education_level", length = 50)
    private String educationLevel;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_subjects", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "subject")
    private List<String> subjects;

    // Stats
    @Column(name = "follower_count")
    @Builder.Default
    private Integer followerCount = 0;

    @Column(name = "following_count")
    @Builder.Default
    private Integer followingCount = 0;

    @Column(name = "friend_count")
    @Builder.Default
    private Integer friendCount = 0;

    @Column(name = "post_count")
    @Builder.Default
    private Integer postCount = 0;

    // Settings
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_private")
    @Builder.Default
    private Boolean isPrivate = false;

    @Column(name = "show_online_status")
    @Builder.Default
    private Boolean showOnlineStatus = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
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
