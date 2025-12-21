package com.muse.notes.service;

import com.muse.notes.entity.Notebook;
import com.muse.notes.entity.Section;
import com.muse.notes.entity.SectionNoteMapping;
import com.muse.notes.repository.NotebookRepository;
import com.muse.notes.repository.SectionNoteMappingRepository;
import com.muse.notes.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FolderAutomationService {

        private final SectionRepository sectionRepo;
        private final NotebookRepository notebookRepo;
        private final SectionNoteMappingRepository mappingRepo;
        private final SimpMessagingTemplate messagingTemplate;

        /**
         * Handle the logic for "Direct-to-Folder" (D2F) note organization.
         * 
         * @param recipientId ID of the user receiving the note
         * @param noteId      ID of the note being shared
         * @param folderName  Sub-folder name (e.g., "From Bob")
         */
        @Transactional
        public void organizeSharedNote(Long recipientId, Long noteId, String folderName) {
                log.info("D2F Service: Organizing note {} for recipient {} into sub-folder '{}'", noteId, recipientId,
                                folderName);

                // Map recipientId to username
                String username = "user_" + recipientId;

                // 1. Check for/Create Main Notebook
                Notebook notebook = notebookRepo.findByOwnerUsernameOrderByOrderIndexAsc(username)
                                .stream().findFirst()
                                .orElseGet(() -> createDefaultNotebook(username));

                // 2. Check for/Create root folder "Shared Notes"
                Section sharedNotesRoot = sectionRepo.findByNotebookIdAndTitle(notebook.getId(), "Shared Notes")
                                .stream()
                                .filter(s -> s.getParent() == null)
                                .findFirst()
                                .orElseGet(() -> createSection(notebook, "Shared Notes", null));

                // 3. Check for/Create sub-folder (folderName)
                Section subFolder = sectionRepo.findByNotebookIdAndTitle(notebook.getId(), folderName)
                                .stream()
                                .filter(s -> s.getParent() != null
                                                && s.getParent().getId().equals(sharedNotesRoot.getId()))
                                .findFirst()
                                .orElseGet(() -> createSection(notebook, folderName, sharedNotesRoot));

                // 4. Link the noteId to this sub-folder (Many-to-Many injection)
                if (mappingRepo.findBySectionIdAndNoteId(subFolder.getId(), noteId).isEmpty()) {
                        SectionNoteMapping mapping = SectionNoteMapping.builder()
                                        .sectionId(subFolder.getId())
                                        .noteId(noteId)
                                        .createdAt(Instant.now())
                                        .build();
                        mappingRepo.save(mapping);
                        log.info("D2F Success: Linked note {} to folder {}", noteId, subFolder.getId());

                        // 5. WebSocket Signal: REFRESH_FOLDERS
                        // User-specific refresh to /user/{userId}/topic/sidebar
                        messagingTemplate.convertAndSendToUser(
                                        username,
                                        "/topic/sidebar",
                                        Map.of("type", "REFRESH_FOLDERS", "source", "D2F_BRIDGE", "folderId",
                                                        subFolder.getId()));
                }
        }

        private Notebook createDefaultNotebook(String username) {
                Notebook nb = new Notebook();
                nb.setOwnerUsername(username);
                nb.setTitle("Main Notebook");
                nb.setCreatedAt(Instant.now());
                nb.setUpdatedAt(Instant.now());
                return notebookRepo.save(nb);
        }

        private Section createSection(Notebook notebook, String title, Section parent) {
                Section section = new Section();
                section.setNotebook(notebook);
                section.setTitle(title);
                section.setParent(parent);
                section.setCreatedAt(Instant.now());
                section.setUpdatedAt(Instant.now());
                section.setOrderIndex(0);
                return sectionRepo.save(section);
        }
}
