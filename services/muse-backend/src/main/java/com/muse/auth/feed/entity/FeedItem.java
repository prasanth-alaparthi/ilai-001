package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "feed_items")
@Data
public class FeedItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="owner_username")
    private String ownerUsername;

    @Column
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name="content_type")
    private String contentType;

    @Column
    private String thumbnail;

    @Column(columnDefinition = "jsonb")
    private String topics;

    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();

    @Column(name="published_at")
    private Instant publishedAt;

    @Column
    private String visibility = "public";
}