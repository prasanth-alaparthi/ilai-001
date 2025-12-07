package com.muse.notes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String ownerUsername;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String storageFilename; // The name of the file on disk or in the cloud

    @Column(nullable = false)
    private String contentType; // e.g., "image/png", "application/pdf"

    @Column(nullable = false)
    private long size; // Size in bytes

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
