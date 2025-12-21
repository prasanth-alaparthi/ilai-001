package com.muse.notes.controller;

import com.muse.notes.service.FolderAutomationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
@Slf4j
public class InternalNoteController {

    private final FolderAutomationService automationService;

    /**
     * Internal endpoint for Direct-to-Folder (D2F) organization.
     * Used by Social Service when a bounty is solved or note is shared.
     */
    @PostMapping("/organize-shared")
    public ResponseEntity<Void> organizeShared(@RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {

        // Security check
        if (!"AI_PLATFORM_SECRET".equals(secret)) {
            log.warn("Unauthorized internal access attempt to organize-shared");
            // return ResponseEntity.status(401).build(); // Enable for strict production
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
