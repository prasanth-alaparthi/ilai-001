package com.muse.social.application.orchestrator;

import com.muse.social.infrastructure.client.AuthServiceClient;
import com.muse.social.infrastructure.client.NotesServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Note Share Orchestrator - "Living Sync" Bridge.
 * 
 * Implements Direct-to-Folder (D2F) sharing:
 * When Student B shares a note with Student A, this orchestrator:
 * 
 * 1. Calls auth-service to get Student B's display name
 * 2. Creates/finds "Shared Notes" folder in Student A's notebook
 * 3. Creates/finds "From [Student B Name]" sub-folder
 * 4. Injects the shared note reference into this folder
 * 5. Emits WebSocket notification to Student A for real-time UI update
 * 
 * This eliminates the need for Student A to manually organize shared notes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NoteShareOrchestrator {

    private final AuthServiceClient authClient;
    private final NotesServiceClient notesClient;
    private final SimpMessagingTemplate messagingTemplate;

    // Folder naming conventions
    private static final String ROOT_SHARED_FOLDER = "Shared Notes";
    private static final String SENDER_FOLDER_PREFIX = "From ";

    /**
     * Execute the D2F (Direct-to-Folder) sharing flow.
     * 
     * @param sourceUserId Student B (sharer)
     * @param targetUserId Student A (recipient)
     * @param noteId       Note being shared
     * @param noteTitle    Title of the shared note
     * @return true if successfully shared
     */
    public boolean executeDirectToFolderShare(Long sourceUserId, Long targetUserId,
            Long noteId, String noteTitle) {
        log.info("D2F Share: User {} sharing note {} with user {}",
                sourceUserId, noteId, targetUserId);

        try {
            // STEP 1: Get sharer's display name from auth-service
            String sharerName = authClient.getDisplayName(sourceUserId);
            log.debug("Sharer display name: {}", sharerName);

            // STEP 2: Create/find "Shared Notes" root folder for recipient
            Long sharedFolderId = notesClient.createOrFindFolder(
                    targetUserId,
                    ROOT_SHARED_FOLDER,
                    null // Root level
            );

            if (sharedFolderId == null) {
                log.warn("Failed to create/find Shared Notes folder for user {}", targetUserId);
                return false;
            }
            log.debug("Shared Notes folder ID: {}", sharedFolderId);

            // STEP 3: Create/find "From [Student B Name]" sub-folder
            String senderFolderName = SENDER_FOLDER_PREFIX + sharerName;
            Long senderFolderId = notesClient.createOrFindFolder(
                    targetUserId,
                    senderFolderName,
                    sharedFolderId // Inside "Shared Notes"
            );

            if (senderFolderId == null) {
                log.warn("Failed to create sender folder '{}'", senderFolderName);
                return false;
            }
            log.debug("Sender folder '{}' ID: {}", senderFolderName, senderFolderId);

            // STEP 4: Inject the shared note into the sender's folder
            boolean injected = notesClient.injectSharedNoteToFolder(
                    targetUserId,
                    noteId,
                    senderFolderId,
                    sourceUserId);

            if (!injected) {
                log.warn("Failed to inject note {} into folder", noteId);
                return false;
            }

            // STEP 5: Emit WebSocket notification for real-time UI update
            emitFolderUpdateNotification(targetUserId, sourceUserId, sharerName,
                    noteId, noteTitle, senderFolderId);

            log.info("D2F Share complete: Note {} → User {}'s folder '{}'",
                    noteId, targetUserId, senderFolderName);

            return true;

        } catch (Exception e) {
            log.error("D2F Share failed: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Async version for fire-and-forget sharing.
     */
    @Async
    public CompletableFuture<Boolean> executeDirectToFolderShareAsync(
            Long sourceUserId, Long targetUserId, Long noteId, String noteTitle) {
        boolean result = executeDirectToFolderShare(sourceUserId, targetUserId, noteId, noteTitle);
        return CompletableFuture.completedFuture(result);
    }

    /**
     * Handle bounty solution sharing.
     * When a bounty is solved, share the solution note with the bounty creator.
     * 
     * @param solverUserId   User who solved the bounty
     * @param creatorUserId  User who created the bounty
     * @param solutionNoteId Solution note ID
     * @param bountyTitle    Bounty title
     */
    public boolean shareBountySolution(Long solverUserId, Long creatorUserId,
            Long solutionNoteId, String bountyTitle) {
        log.info("Sharing bounty solution: Note {} from solver {} to creator {}",
                solutionNoteId, solverUserId, creatorUserId);

        // Use D2F flow but with custom folder name
        try {
            String solverName = authClient.getDisplayName(solverUserId);

            // Create "Bounty Solutions" folder instead of "Shared Notes"
            Long solutionsFolderId = notesClient.createOrFindFolder(
                    creatorUserId,
                    "Bounty Solutions",
                    null);

            if (solutionsFolderId == null) {
                return false;
            }

            // Create sub-folder for this solver
            String solverFolderName = SENDER_FOLDER_PREFIX + solverName;
            Long solverFolderId = notesClient.createOrFindFolder(
                    creatorUserId,
                    solverFolderName,
                    solutionsFolderId);

            if (solverFolderId == null) {
                return false;
            }

            // Inject solution note
            boolean injected = notesClient.injectSharedNoteToFolder(
                    creatorUserId,
                    solutionNoteId,
                    solverFolderId,
                    solverUserId);

            if (injected) {
                emitBountySolutionNotification(creatorUserId, solverUserId,
                        solverName, solutionNoteId, bountyTitle);
            }

            return injected;

        } catch (Exception e) {
            log.error("Failed to share bounty solution: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Emit WebSocket notification for folder tree update.
     */
    private void emitFolderUpdateNotification(Long targetUserId, Long sourceUserId,
            String sharerName, Long noteId,
            String noteTitle, Long folderId) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "note_shared",
                    "action", "folder_updated",
                    "fromUserId", sourceUserId,
                    "fromUserName", sharerName,
                    "noteId", noteId,
                    "noteTitle", noteTitle,
                    "folderId", folderId,
                    "folderPath", ROOT_SHARED_FOLDER + "/" + SENDER_FOLDER_PREFIX + sharerName,
                    "timestamp", LocalDateTime.now().toString(),
                    "message", sharerName + " shared \"" + noteTitle + "\" with you");

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(targetUserId),
                    "/queue/notifications",
                    notification);

            // Also send to folder update channel for tree refresh
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(targetUserId),
                    "/queue/folders",
                    Map.of(
                            "type", "folder_updated",
                            "folderId", folderId,
                            "action", "note_added"));

            log.debug("Sent folder update notification to user {}", targetUserId);

        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }
    }

    /**
     * Emit notification specifically for bounty solutions.
     */
    private void emitBountySolutionNotification(Long creatorUserId, Long solverUserId,
            String solverName, Long solutionNoteId,
            String bountyTitle) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "bounty_solution",
                    "action", "solution_shared",
                    "fromUserId", solverUserId,
                    "fromUserName", solverName,
                    "noteId", solutionNoteId,
                    "bountyTitle", bountyTitle,
                    "timestamp", LocalDateTime.now().toString(),
                    "message", solverName + " shared their solution for \"" + bountyTitle + "\"");

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(creatorUserId),
                    "/queue/notifications",
                    notification);

        } catch (Exception e) {
            log.warn("Failed to send bounty solution notification: {}", e.getMessage());
        }
    }
}
