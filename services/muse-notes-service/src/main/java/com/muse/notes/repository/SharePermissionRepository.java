package com.muse.notes.repository;

import com.muse.notes.entity.SharePermission;
import com.muse.notes.entity.SharePermission.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SharePermissionRepository extends JpaRepository<SharePermission, Long> {

        // Find all shares by owner
        List<SharePermission> findByOwnerId(Long ownerId);

        List<SharePermission> findByOwnerUsername(String ownerUsername);

        // Find all shares with a user (shared with me)
        List<SharePermission> findBySharedWithId(Long sharedWithId);

        List<SharePermission> findBySharedWithUsername(String sharedWithUsername);

        // Find all shares for a specific resource
        List<SharePermission> findByResourceTypeAndResourceId(ResourceType resourceType, Long resourceId);

        // Find specific share
        Optional<SharePermission> findByResourceTypeAndResourceIdAndSharedWithId(
                        ResourceType resourceType, Long resourceId, Long sharedWithId);

        Optional<SharePermission> findByResourceTypeAndResourceIdAndSharedWithUsername(
                        ResourceType resourceType, Long resourceId, String sharedWithUsername);

        // Find if user has access to a resource
        @Query("SELECT sp FROM SharePermission sp WHERE sp.resourceType = :type AND sp.resourceId = :id " +
                        "AND (sp.ownerId = :userId OR sp.sharedWithId = :userId)")
        Optional<SharePermission> findUserAccessById(
                        @Param("type") ResourceType type,
                        @Param("id") Long id,
                        @Param("userId") Long userId);

        @Query("SELECT sp FROM SharePermission sp WHERE sp.resourceType = :type AND sp.resourceId = :id " +
                        "AND (sp.ownerUsername = :username OR sp.sharedWithUsername = :username)")
        Optional<SharePermission> findUserAccess(
                        @Param("type") ResourceType type,
                        @Param("id") Long id,
                        @Param("username") String username);

        // Get all notebooks shared with a user
        @Query("SELECT sp FROM SharePermission sp WHERE sp.sharedWithId = :userId " +
                        "AND sp.resourceType = 'NOTEBOOK' AND sp.accepted = true")
        List<SharePermission> findSharedNotebooksByUserId(@Param("userId") Long userId);

        @Query("SELECT sp FROM SharePermission sp WHERE sp.sharedWithUsername = :username " +
                        "AND sp.resourceType = 'NOTEBOOK' AND sp.accepted = true")
        List<SharePermission> findSharedNotebooks(@Param("username") String username);

        // Get all notes shared with a user
        @Query("SELECT sp FROM SharePermission sp WHERE sp.sharedWithId = :userId " +
                        "AND sp.resourceType = 'NOTE' AND sp.accepted = true")
        List<SharePermission> findSharedNotesByUserId(@Param("userId") Long userId);

        @Query("SELECT sp FROM SharePermission sp WHERE sp.sharedWithUsername = :username " +
                        "AND sp.resourceType = 'NOTE' AND sp.accepted = true")
        List<SharePermission> findSharedNotes(@Param("username") String username);

        // Delete all shares for a resource
        void deleteByResourceTypeAndResourceId(ResourceType resourceType, Long resourceId);

        // Count pending share invitations
        long countBySharedWithIdAndAcceptedFalse(Long userId);

        long countBySharedWithUsernameAndAcceptedFalse(String username);
}
