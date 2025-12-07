package com.muse.auth.flash.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="quiz_attempts")
@Data
public class QuizAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="flashcard_id")
    private Long flashcardId;

    @Column
    private String username;

    private Integer score;
    private Integer total;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();
}