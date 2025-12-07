package com.muse.notes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "note_suggestions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(nullable = false)
    private String type; // e.g., "DEAD_LINK", "RELATED_NOTE", "TAG_SUGGESTION"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String suggestionContent; // The actual suggestion (e.g., a suggested tag, a link to another note)

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
