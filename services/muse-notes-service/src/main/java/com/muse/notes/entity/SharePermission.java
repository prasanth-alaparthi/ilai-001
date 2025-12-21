package com.muse.notes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Represents shared access to a notebook, section, or note.
 * Supports sharing with specific users and permission levels.
 */
@Entity
@Table(name = "share_permissions", uniqueConstraints = @UniqueConstraint(columnNames = { "resource_type", "resource_id",
        "shared_with_id" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false)
    private ResourceType resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "owner_username", nullable = false)
    private String ownerUsername;

    @Column(name = "shared_with_id")
    private Long sharedWithId;

    @Column(name = "shared_with_username", nullable = false)
    private String sharedWithUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_level", nullable = false)
    private PermissionLevel permissionLevel;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Optional message from owner
    @Column(name = "message", length = 500)
    private String message;

    // Accepted by the recipient
    @Column(name = "accepted")
    private Boolean accepted;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        accepted = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum ResourceType {
        NOTEBOOK,
        SECTION,
        NOTE
    }

    public enum PermissionLevel {
        VIEWER, // Can only view
        COMMENTER, // Can view and add comments
        EDITOR, // Can edit content
        OWNER // Full access (for transferred ownership)
    }
}
