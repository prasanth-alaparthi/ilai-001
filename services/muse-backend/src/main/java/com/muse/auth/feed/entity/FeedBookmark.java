package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "feed_bookmarks")
@Data
public class FeedBookmark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="feed_item_id")
    private Long feedItemId;

    @Column
    private String username;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();
}