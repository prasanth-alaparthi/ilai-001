package com.muse.notes.controller;

import com.muse.notes.service.FolderAutomationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
@Slf4j
public class InternalNoteController {

    private final FolderAutomationService automationService;

    @Value("${internal.service.token:CHANGE_ME_IN_PRODUCTION}")
    private String platformSecret;

    /**
     * Internal endpoint for Direct-to-Folder (D2F) organization.
     * Used by Social Service when a bounty is solved or note is shared.
     */
    @PostMapping("/organize-shared")
    public ResponseEntity<Void> organizeShared(@RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {

        // Security check
        if (!platformSecret.equals(token)) {
            log.warn("Unauthorized internal access attempt to organize-shared from client");
            return ResponseEntity.status(401).build();
        }

        try {
            Long recipientId = Long.valueOf(request.get("recipientId").toString());
            Long noteId = Long.valueOf(request.get("noteId").toString());
            String folderName = (String) request.get("folderName");

            automationService.organizeSharedNote(recipientId, noteId, folderName);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to organize shared note: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
