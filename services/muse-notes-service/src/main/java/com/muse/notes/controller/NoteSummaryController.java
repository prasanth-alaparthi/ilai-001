package com.muse.notes.controller;

import com.muse.notes.entity.Note;
import com.muse.notes.repository.NoteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
public class NoteSummaryController extends BaseController {

    private final NoteRepository noteRepo;

    public NoteSummaryController(NoteRepository noteRepo) {
        this.noteRepo = noteRepo;
    }

    /**
     * GET /api/notes/{id}/summary
     * - If note.summary exists, return it.
     * - Else return a placeholder status so frontend can handle gracefully.
     *
     * This is a stub. Later you can integrate AI here and replace placeholder logic.
     */
    @GetMapping("/{id}/summary")
    public ResponseEntity<?> getSummary(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> n = noteRepo.findByIdAndOwnerUsername(id, username);
        if (n.isEmpty()) return ResponseEntity.notFound().build();

        Note note = n.get();
        String summary = note.getSummary(); // Note entity should have getSummary()
        if (summary != null && !summary.isBlank()) {
            return ResponseEntity.ok(Map.of("summary", summary, "status", "ok"));
        } else {
            // placeholder response until AI is enabled
            String placeholder = "Summary service not enabled. To enable, configure AI provider and generate summaries.";
            return ResponseEntity.ok(Map.of("summary", null, "status", "not-available", "message", placeholder));
        }
    }
}
