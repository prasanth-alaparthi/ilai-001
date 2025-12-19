package com.muse.notes.journal.controller;

import com.muse.notes.journal.service.JournalService;
import com.muse.notes.journal.entity.JournalEntry;
import com.muse.notes.journal.entity.ReviewStatus;
import com.muse.notes.journal.entity.Submission;
import com.muse.notes.journal.repository.JournalEntryRepository;
import com.muse.notes.journal.repository.SubmissionRepository;
import com.muse.notes.journal.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal/entries")
@RequiredArgsConstructor
public class JournalEntryController {

    private final JournalService journalService;
    private final JournalEntryRepository journalEntryRepository;
    private final SubmissionRepository submissionRepository;

    @GetMapping
    public ResponseEntity<List<JournalEntry>> listEntries(Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return ResponseEntity.ok(journalService.listUserEntries(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JournalEntry> getEntry(@PathVariable Long id, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId) && e.getDeletedAt() == null)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<JournalEntry> createEntry(@RequestBody Map<String, Object> payload, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);

        JournalEntry entry = new JournalEntry();
        entry.setUserId(userId);
        entry.setTitle((String) payload.getOrDefault("title", "Untitled"));
        entry.setContentJson((String) payload.get("contentJson"));
        entry.setCourseCode((String) payload.get("courseCode"));
        entry.setStatus("DRAFT");
        entry.setEntryDate(LocalDate.now()); // Default to today

        // Legacy fields (optional)
        entry.setHighlights("");
        entry.setChallenges("");
        entry.setIntentions("");

        return ResponseEntity.ok(journalEntryRepository.save(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JournalEntry> updateEntry(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);

        return journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .map(entry -> {
                    entry.setTitle((String) payload.getOrDefault("title", entry.getTitle()));
                    entry.setContentJson((String) payload.get("contentJson"));
                    entry.setCourseCode((String) payload.get("courseCode"));
                    return ResponseEntity.ok(journalEntryRepository.save(entry));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEntry(@PathVariable Long id, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        journalService.moveToTrash(id, userId);
        return ResponseEntity.ok(Map.of("message", "Moved to trash"));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreEntry(@PathVariable Long id, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        journalService.restoreFromTrash(id, userId);
        return ResponseEntity.ok(Map.of("message", "Restored from trash"));
    }

    @GetMapping("/trash")
    public ResponseEntity<List<JournalEntry>> getTrash(Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return ResponseEntity.ok(journalService.getTrash(userId));
    }

    @DeleteMapping("/trash")
    public ResponseEntity<?> emptyTrash(Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        journalService.emptyTrash(userId);
        return ResponseEntity.ok(Map.of("message", "Trash emptied"));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> deletePermanent(@PathVariable Long id, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        journalService.deleteJournalEntry(id, userId);
        return ResponseEntity.ok(Map.of("message", "Deleted permanently"));
    }

    @PutMapping("/{id}/tags")
    public ResponseEntity<?> updateTags(@PathVariable Long id, @RequestBody Map<String, List<String>> payload,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        List<String> tagsList = payload.get("tags");
        String[] tags = tagsList != null ? tagsList.toArray(new String[0]) : new String[0];
        journalService.updateTags(id, userId, tags);
        return ResponseEntity.ok(Map.of("message", "Tags updated"));
    }

    @GetMapping("/search")
    public ResponseEntity<List<JournalEntry>> search(@RequestParam String q, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return ResponseEntity.ok(journalService.search(userId, q));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitEntry(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        String username = getUsername(auth);

        return journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .map(entry -> {
                    String courseCode = (String) payload.get("courseCode");
                    if (courseCode == null || courseCode.isEmpty()) {
                        courseCode = entry.getCourseCode();
                    }

                    if (courseCode == null || courseCode.isEmpty()) {
                        return ResponseEntity.badRequest().body("Course code is required for submission");
                    }

                    entry.setStatus("SUBMITTED");
                    entry.setCourseCode(courseCode);
                    journalEntryRepository.save(entry);

                    // Create Submission record
                    Submission submission = new Submission();
                    submission.setEntryId(entry.getId());
                    submission.setAuthorUsername(username);
                    submission.setCourseCode(courseCode);
                    submission.setClassName((String) payload.getOrDefault("className", ""));
                    submission.setSubmittedAt(Instant.now());
                    submission.setStatus(ReviewStatus.SUBMITTED);
                    submissionRepository.save(submission);

                    return ResponseEntity.ok(Map.of("message", "Submitted successfully", "status", "SUBMITTED"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== Semantic Search ====================
    @PostMapping("/semantic-search")
    public ResponseEntity<?> semanticSearch(@RequestBody Map<String, Object> body, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        String query = (String) body.getOrDefault("query", "");
        int limit = (int) body.getOrDefault("limit", 10);

        if (query.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Query is required"));
        }

        try {
            // Use JournalService for semantic search
            List<JournalEntry> results = journalService.semanticSearch(userId, query, limit);
            return ResponseEntity.ok(Map.of("results", results, "count", results.size()));
        } catch (Exception e) {
            // Fallback to text search if semantic fails
            List<JournalEntry> fallback = journalService.search(userId, query);
            return ResponseEntity.ok(Map.of(
                    "results", fallback,
                    "count", fallback.size(),
                    "fallback", true,
                    "message", "Used text search: " + e.getMessage()));
        }
    }

    private String getUsername(Authentication auth) {
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            return jwt.getSubject(); // This is usually the username or sub
        }
        return auth.getName();
    }
}
