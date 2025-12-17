package com.muse.notes.service;

import com.muse.notes.entity.SharePermission;
import com.muse.notes.entity.SharePermission.PermissionLevel;
import com.muse.notes.entity.SharePermission.ResourceType;
import com.muse.notes.repository.NoteRepository;
import com.muse.notes.repository.NotebookRepository;
import com.muse.notes.repository.SectionRepository;
import com.muse.notes.repository.SharePermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ShareService {

    private final SharePermissionRepository shareRepo;
    private final NotebookRepository notebookRepo;
    private final SectionRepository sectionRepo;
    private final NoteRepository noteRepo;

    /**
     * Share a resource with another user
     */
    public Optional<SharePermission> shareResource(
            ResourceType resourceType,
            Long resourceId,
            String ownerUsername,
            String targetUsername,
            PermissionLevel permission,
            String message) {

        // Verify ownership
        boolean isOwner = verifyOwnership(resourceType, resourceId, ownerUsername);
        if (!isOwner) {
            log.warn("User {} tried to share resource they don't own: {} {}", ownerUsername, resourceType, resourceId);
            return Optional.empty();
        }

        // Check if already shared
        var existing = shareRepo.findByResourceTypeAndResourceIdAndSharedWithUsername(
                resourceType, resourceId, targetUsername);
        if (existing.isPresent()) {
            // Update existing permission
            var share = existing.get();
            share.setPermissionLevel(permission);
            share.setMessage(message);
            return Optional.of(shareRepo.save(share));
        }

        // Create new share
        SharePermission share = SharePermission.builder()
                .resourceType(resourceType)
                .resourceId(resourceId)
                .ownerUsername(ownerUsername)
                .sharedWithUsername(targetUsername)
                .permissionLevel(permission)
                .message(message)
                .accepted(false)
                .build();

        return Optional.of(shareRepo.save(share));
    }

    /**
     * Accept a share invitation
     */
    public Optional<SharePermission> acceptShare(Long shareId, String username) {
        return shareRepo.findById(shareId)
                .filter(s -> s.getSharedWithUsername().equals(username))
                .map(s -> {
                    s.setAccepted(true);
                    return shareRepo.save(s);
                });
    }

    /**
     * Decline/remove a share
     */
    public boolean removeShare(Long shareId, String username) {
        return shareRepo.findById(shareId)
                .filter(s -> s.getOwnerUsername().equals(username) || s.getSharedWithUsername().equals(username))
                .map(s -> {
                    shareRepo.delete(s);
                    return true;
                }).orElse(false);
    }

    /**
     * Get all resources shared with a user
     */
    public List<SharePermission> getSharedWithMe(String username) {
        return shareRepo.findBySharedWithUsername(username);
    }

    /**
     * Get pending invitations for a user
     */
    public List<SharePermission> getPendingInvitations(String username) {
        return shareRepo.findBySharedWithUsername(username).stream()
                .filter(s -> !Boolean.TRUE.equals(s.getAccepted()))
                .toList();
    }

    /**
     * Get all shares created by a user
     */
    public List<SharePermission> getMyShares(String username) {
        return shareRepo.findByOwnerUsername(username);
    }

    /**
     * Check if user has access to a resource
     */
    public boolean hasAccess(ResourceType resourceType, Long resourceId, String username,
            PermissionLevel requiredLevel) {
        // First check if owner
        if (verifyOwnership(resourceType, resourceId, username)) {
            return true;
        }

        // Check share permissions
        return shareRepo.findByResourceTypeAndResourceIdAndSharedWithUsername(resourceType, resourceId, username)
                .filter(s -> Boolean.TRUE.equals(s.getAccepted()))
                .map(s -> s.getPermissionLevel().ordinal() >= requiredLevel.ordinal())
                .orElse(false);
    }

    /**
     * Verify if user owns the resource
     */
    private boolean verifyOwnership(ResourceType resourceType, Long resourceId, String username) {
        return switch (resourceType) {
            case NOTEBOOK -> notebookRepo.findByIdAndOwnerUsername(resourceId, username).isPresent();
            case SECTION -> sectionRepo.findByIdAndNotebookOwnerUsername(resourceId, username).isPresent();
            case NOTE -> noteRepo.findByIdAndOwnerUsername(resourceId, username).isPresent();
        };
    }
}
