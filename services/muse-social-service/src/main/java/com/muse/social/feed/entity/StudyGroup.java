package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Study Group (LinkedIn-style)
 */
@Entity
@Table(name = "study_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_hashtags", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "hashtag")
    private List<String> hashtags;

    // Settings
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GroupVisibility visibility = GroupVisibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "join_approval")
    @Builder.Default
    private ApprovalType joinApproval = ApprovalType.AUTO;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_approval")
    @Builder.Default
    private ApprovalType postApproval = ApprovalType.AUTO;

    // Context
    @Enumerated(EnumType.STRING)
    @Column(name = "group_type")
    @Builder.Default
    private GroupType groupType = GroupType.TOPIC;

    @Column(name = "education_level")
    private String educationLevel;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_subjects", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "subject")
    private List<String> subjects;

    // Stats
    @Column(name = "member_count")
    @Builder.Default
    private Integer memberCount = 0;

    @Column(name = "post_count")
    @Builder.Default
    private Integer postCount = 0;

    // Admin
    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum GroupVisibility {
        PUBLIC, PRIVATE, SECRET
    }

    public enum ApprovalType {
        AUTO, ADMIN_APPROVAL
    }

    public enum GroupType {
        TOPIC, CLASS, SCHOOL, EXAM, CLUB
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
