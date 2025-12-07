package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "feed_comments")
@Data
public class FeedComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="feed_item_id")
    private Long feedItemId;

    @Column
    private String username;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();
}