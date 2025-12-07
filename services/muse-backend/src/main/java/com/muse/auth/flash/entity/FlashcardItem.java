package com.muse.auth.flash.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="flashcard_items")
@Data
public class FlashcardItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="flashcard_id")
    private Long flashcardId;

    @Column(columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();
}