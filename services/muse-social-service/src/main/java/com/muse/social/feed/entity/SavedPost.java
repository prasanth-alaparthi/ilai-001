package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Saved posts by users
 */
@Entity
@Table(name = "saved_posts")
@IdClass(SavedPostId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedPost {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Id
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "collection_name")
    @Builder.Default
    private String collectionName = "default";

    @Column(name = "saved_at")
    private Instant savedAt;

    @PrePersist
    protected void onCreate() {
        this.savedAt = Instant.now();
    }
}
