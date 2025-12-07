// src/main/java/com/muse/auth/notes/entity/SharedNote.java
package com.muse.notes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "shared_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SharedNote {
    @Id
    private String token;

    @Column(name = "note_id", nullable = false)
    private Long noteId;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;
}
