package com.muse.notes.journal.controller;

import com.muse.notes.journal.dto.ReviewDecisionRequest;
import com.muse.notes.journal.entity.Submission;
import com.muse.notes.journal.service.JournalService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal/teacher")
public class JournalTeacherController {

    private final JournalService journalService;

    public JournalTeacherController(JournalService journalService) {
        this.journalService = journalService;
    }

    private String currentUsername(Authentication auth) {
        if (auth == null)
            return null;
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            return jwt.getSubject();
        }
        return auth.getName();
    }

    // GET /api/journal/teacher/queue?courseCode=X
    @GetMapping("/queue")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> reviewQueue(@RequestParam String courseCode,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        // TODO: check teacher is actually assigned to this course (when course mapping
        // exists)

        List<Submission> subs = journalService.listSubmissionsForCourseQueue(courseCode);
        List<Map<String, Object>> dto = subs.stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("entryId", s.getEntryId());
            m.put("authorUsername", s.getAuthorUsername());
            m.put("courseCode", s.getCourseCode());
            m.put("className", s.getClassName());
            m.put("status", s.getStatus());
            m.put("submittedAt", s.getSubmittedAt());
            return m;
        }).toList();

        return ResponseEntity.ok(dto);
    }

    // POST /api/journal/teacher/submissions/{id}/decision
    @PostMapping("/submissions/{id}/decision")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> decide(@PathVariable Long id,
            @Valid @RequestBody ReviewDecisionRequest payload,
            Authentication auth) {
        String reviewer = currentUsername(auth);
        if (reviewer == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        return journalService.applyReviewDecision(id, reviewer, payload.getStatus(), payload.getComments())
                .<ResponseEntity<?>>map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", s.getId());
                    m.put("entryId", s.getEntryId());
                    m.put("courseCode", s.getCourseCode());
                    m.put("className", s.getClassName());
                    m.put("status", s.getStatus());
                    m.put("reviewerUsername", s.getReviewerUsername());
                    m.put("reviewerComments", s.getReviewerComments());
                    m.put("reviewedAt", s.getReviewedAt());
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "Submission not found")));
    }
}
