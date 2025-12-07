package com.muse.auth.flash.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="flashcards")
@Data
public class Flashcard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="source_feed_item_id")
    private Long sourceFeedItemId;

    @Column(name="owner_username")
    private String ownerUsername;

    @Column
    private String title;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();

    // Fields for journal package
    @Column(name="note_id")
    private Long noteId;

    @Column(name="username")
    private String username;

    @Column
    private String question;

    @Column
    private String answer;
}