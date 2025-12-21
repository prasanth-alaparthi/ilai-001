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
            Long ownerId,
            String ownerUsername,
            Long targetUserId,
            String targetUsername,
            PermissionLevel permission,
            String message) {

        // Verify ownership
        boolean isOwner = verifyOwnership(resourceType, resourceId, ownerId);
        if (!isOwner) {
            log.warn("User ID {} tried to share resource they don't own: {} {}", ownerId, resourceType, resourceId);
            return Optional.empty();
        }

        // Check if already shared
        var existing = shareRepo.findByResourceTypeAndResourceIdAndSharedWithId(
                resourceType, resourceId, targetUserId);
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
                .ownerId(ownerId)
                .ownerUsername(ownerUsername)
                .sharedWithId(targetUserId)
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
    public Optional<SharePermission> acceptShare(Long shareId, Long userId) {
        return shareRepo.findById(shareId)
                .filter(s -> s.getSharedWithId() != null && s.getSharedWithId().equals(userId))
                .map(s -> {
                    s.setAccepted(true);
                    return shareRepo.save(s);
                });
    }

    /**
     * Decline/remove a share
     */
    public boolean removeShare(Long shareId, Long userId) {
        return shareRepo.findById(shareId)
                .filter(s -> (s.getOwnerId() != null && s.getOwnerId().equals(userId)) ||
                        (s.getSharedWithId() != null && s.getSharedWithId().equals(userId)))
                .map(s -> {
                    shareRepo.delete(s);
                    return true;
                }).orElse(false);
    }

    /**
     * Get all resources shared with a user
     */
    public List<SharePermission> getSharedWithMe(Long userId) {
        return shareRepo.findBySharedWithId(userId);
    }

    /**
     * Get pending invitations for a user
     */
    public List<SharePermission> getPendingInvitations(Long userId) {
        return shareRepo.findBySharedWithId(userId).stream()
                .filter(s -> !Boolean.TRUE.equals(s.getAccepted()))
                .toList();
    }

    /**
     * Get all shares created by a user
     */
    public List<SharePermission> getMyShares(Long userId) {
        return shareRepo.findByOwnerId(userId);
    }

    /**
     * Check if user has access to a resource
     */
    public boolean hasAccess(ResourceType resourceType, Long resourceId, Long userId,
            PermissionLevel requiredLevel) {
        // First check if owner
        if (verifyOwnership(resourceType, resourceId, userId)) {
            return true;
        }

        // Check share permissions
        return shareRepo.findByResourceTypeAndResourceIdAndSharedWithId(resourceType, resourceId, userId)
                .filter(s -> Boolean.TRUE.equals(s.getAccepted()))
                .map(s -> s.getPermissionLevel().ordinal() >= requiredLevel.ordinal())
                .orElse(false);
    }

    /**
     * Verify if user owns the resource
     */
    private boolean verifyOwnership(ResourceType resourceType, Long resourceId, Long userId) {
        return switch (resourceType) {
            case NOTEBOOK -> notebookRepo.findByIdAndUserId(resourceId, userId).isPresent();
            case SECTION -> sectionRepo.findByIdAndNotebookUserId(resourceId, userId).isPresent();
            case NOTE -> noteRepo.findByIdAndUserId(resourceId, userId).isPresent();
        };
    }
}
