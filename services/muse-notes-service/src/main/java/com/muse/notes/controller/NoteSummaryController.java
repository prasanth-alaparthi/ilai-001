package com.muse.notes.controller;

import com.muse.notes.entity.Note;
import com.muse.notes.repository.NoteRepository;
import com.muse.notes.service.GeminiService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
public class NoteSummaryController extends BaseController {

    private final NoteRepository noteRepo;
    private final GeminiService geminiService;

    public NoteSummaryController(NoteRepository noteRepo, GeminiService geminiService) {
        this.noteRepo = noteRepo;
        this.geminiService = geminiService;
    }

    /**
     * GET /api/notes/{id}/summary
     * - If note.summary exists and is fresh, return it.
     * - Otherwise, generate a new summary using Gemini AI.
     */
    @GetMapping("/{id}/summary")
    public ResponseEntity<?> getSummary(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> n = noteRepo.findByIdAndUserId(id, userId);
        if (n.isEmpty())
            return ResponseEntity.notFound().build();

        Note note = n.get();

        // If we have a cached summary, return it
        if (note.getSummary() != null && !note.getSummary().isBlank()) {
            return ResponseEntity.ok(Map.of("summary", note.getSummary(), "status", "ok", "cached", true));
        }

        // Generate new summary using AI
        String textContent = extractTextFromContent(note.getContent());
        if (textContent.length() < 50) {
            return ResponseEntity.ok(Map.of("summary", null, "status", "too-short",
                    "message", "Note content is too short to summarize."));
        }

        try {
            String prompt = "Summarize the following note in 2-3 concise sentences:\n\n" + textContent;
            String summary = geminiService.generateContent(prompt).block();

            // Cache the summary
            note.setSummary(summary);
            noteRepo.save(note);

            return ResponseEntity.ok(Map.of("summary", summary, "status", "ok", "cached", false));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("summary", null, "status", "error",
                    "message", "Failed to generate summary: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/summary/regenerate")
    public ResponseEntity<?> regenerateSummary(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> n = noteRepo.findByIdAndUserId(id, userId);
        if (n.isEmpty())
            return ResponseEntity.notFound().build();

        Note note = n.get();
        String textContent = extractTextFromContent(note.getContent());

        if (textContent.length() < 50) {
            return ResponseEntity.ok(Map.of("summary", null, "status", "too-short",
                    "message", "Note content is too short to summarize."));
        }

        try {
            String prompt = "Summarize the following note in 2-3 concise sentences:\n\n" + textContent;
            String summary = geminiService.generateContent(prompt).block();

            note.setSummary(summary);
            noteRepo.save(note);

            return ResponseEntity.ok(Map.of("summary", summary, "status", "ok"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to generate summary: " + e.getMessage()));
        }
    }

    private String extractTextFromContent(JsonNode node) {
        if (node == null)
            return "";
        if (node.isTextual())
            return node.asText();
        if (node.isObject() && node.has("text"))
            return node.get("text").asText();

        StringBuilder sb = new StringBuilder();
        if (node.has("content")) {
            for (JsonNode child : node.get("content")) {
                sb.append(extractTextFromContent(child)).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
