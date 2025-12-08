package com.muse.notes.journal.controller;

import com.muse.notes.journal.entity.Publication;
import com.muse.notes.journal.service.JournalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal/publications")
public class JournalPublicationController {

    private final JournalService journalService;

    public JournalPublicationController(JournalService journalService) {
        this.journalService = journalService;
    }

    // GET /api/journal/publications?courseCode=X
    @GetMapping
    public ResponseEntity<?> listPublications(@RequestParam String courseCode) {
        List<Publication> pubs = journalService.listPublicationsForCourse(courseCode);

        List<Map<String, Object>> dto = pubs.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("entryId", p.getEntryId());
            m.put("submissionId", p.getSubmissionId());
            m.put("courseCode", p.getCourseCode());
            m.put("publishedBy", p.getPublishedByUsername());
            m.put("publishedAt", p.getPublishedAt());
            m.put("tags", p.getTags());
            return m;
        }).toList();

        return ResponseEntity.ok(dto);
    }
}
