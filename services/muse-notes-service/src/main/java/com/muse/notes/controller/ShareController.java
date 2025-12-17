package com.muse.notes.controller;

import com.muse.notes.entity.SharePermission;
import com.muse.notes.entity.SharePermission.PermissionLevel;
import com.muse.notes.entity.SharePermission.ResourceType;
import com.muse.notes.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
public class ShareController extends BaseController {

    private final ShareService shareService;

    /**
     * Share a resource with another user
     */
    @PostMapping
    public ResponseEntity<?> share(@RequestBody ShareRequest request, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (username.equals(request.targetUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot share with yourself"));
        }

        try {
            ResourceType resourceType = ResourceType.valueOf(request.resourceType().toUpperCase());
            PermissionLevel permission = PermissionLevel.valueOf(request.permissionLevel().toUpperCase());

            return shareService.shareResource(
                    resourceType,
                    request.resourceId(),
                    username,
                    request.targetUsername(),
                    permission,
                    request.message()).map(
                            s -> ResponseEntity.ok(Map.of(
                                    "id", s.getId(),
                                    "resourceType", s.getResourceType(),
                                    "resourceId", s.getResourceId(),
                                    "sharedWith", s.getSharedWithUsername(),
                                    "permissionLevel", s.getPermissionLevel(),
                                    "message", "Shared successfully")))
                    .orElse(ResponseEntity.badRequest()
                            .body(Map.of("message", "Failed to share. You may not own this resource.")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid resource type or permission level"));
        }
    }

    /**
     * Get all resources shared with me
     */
    @GetMapping("/with-me")
    public ResponseEntity<?> getSharedWithMe(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<SharePermission> shares = shareService.getSharedWithMe(username);
        return ResponseEntity.ok(shares.stream().map(this::toDto).toList());
    }

    /**
     * Get pending invitations
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingInvitations(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<SharePermission> pending = shareService.getPendingInvitations(username);
        return ResponseEntity.ok(pending.stream().map(this::toDto).toList());
    }

    /**
     * Get my shares (resources I've shared with others)
     */
    @GetMapping("/my-shares")
    public ResponseEntity<?> getMyShares(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<SharePermission> shares = shareService.getMyShares(username);
        return ResponseEntity.ok(shares.stream().map(this::toDto).toList());
    }

    /**
     * Accept a share invitation
     */
    @PostMapping("/{shareId}/accept")
    public ResponseEntity<?> acceptShare(@PathVariable Long shareId, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        return shareService.acceptShare(shareId, username)
                .map(s -> ResponseEntity.ok(Map.of("message", "Share accepted", "share", toDto(s))))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Decline/remove a share
     */
    @DeleteMapping("/{shareId}")
    public ResponseEntity<?> removeShare(@PathVariable Long shareId, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        boolean removed = shareService.removeShare(shareId, username);
        if (removed) {
            return ResponseEntity.ok(Map.of("message", "Share removed"));
        }
        return ResponseEntity.notFound().build();
    }

    private Map<String, Object> toDto(SharePermission s) {
        return Map.of(
                "id", s.getId(),
                "resourceType", s.getResourceType().name(),
                "resourceId", s.getResourceId(),
                "ownerUsername", s.getOwnerUsername(),
                "sharedWithUsername", s.getSharedWithUsername(),
                "permissionLevel", s.getPermissionLevel().name(),
                "message", s.getMessage() != null ? s.getMessage() : "",
                "accepted", Boolean.TRUE.equals(s.getAccepted()),
                "createdAt", s.getCreatedAt().toString());
    }

    // Request record
    record ShareRequest(
            String resourceType,
            Long resourceId,
            String targetUsername,
            String permissionLevel,
            String message) {
    }
}
