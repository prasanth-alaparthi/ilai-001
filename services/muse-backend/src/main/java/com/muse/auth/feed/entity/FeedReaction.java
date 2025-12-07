package com.muse.auth.feed.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "feed_reactions")
@Data
public class FeedReaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="feed_item_id")
    private Long feedItemId;

    @Column
    private String username;

    @Column(name="reaction_type")
    private String reactionType;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();
}