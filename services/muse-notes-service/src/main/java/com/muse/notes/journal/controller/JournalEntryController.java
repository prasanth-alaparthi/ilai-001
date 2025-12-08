package com.muse.notes.journal.controller;

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

    private final JournalEntryRepository journalEntryRepository;
    private final SubmissionRepository submissionRepository;

    @GetMapping
    public ResponseEntity<List<JournalEntry>> listEntries(Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return ResponseEntity.ok(journalEntryRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JournalEntry> getEntry(@PathVariable Long id, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
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
                    // Don't update status here unless explicitly needed, usually status changes via
                    // submit
                    return ResponseEntity.ok(journalEntryRepository.save(entry));
                })
                .orElse(ResponseEntity.notFound().build());
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

    private String getUsername(Authentication auth) {
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            return jwt.getSubject(); // This is usually the username or sub
        }
        return auth.getName();
    }
}
