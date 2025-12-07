package com.muse.notes.journal.controller;

import com.muse.notes.journal.service.JournalInsightService;
import com.muse.notes.journal.service.JournalService;
import com.muse.notes.journal.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;
    private final JournalInsightService journalInsightService;

    @GetMapping("/entry")
    public ResponseEntity<?> getJournalEntry(@RequestParam String date, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate entryDate = LocalDate.parse(date);
        return ResponseEntity.of(journalService.getJournalEntry(userId, entryDate));
    }

    @PostMapping("/entry")
    public ResponseEntity<?> saveJournalEntry(@RequestBody Map<String, String> payload, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate entryDate = LocalDate.parse(payload.get("date"));
        String highlights = payload.get("highlights");
        String challenges = payload.get("challenges");
        String intentions = payload.get("intentions");
        return ResponseEntity
                .ok(journalService.saveJournalEntry(userId, entryDate, highlights, challenges, intentions));
    }

    @GetMapping("/mood")
    public ResponseEntity<?> getMood(@RequestParam String date, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate entryDate = LocalDate.parse(date);
        return ResponseEntity.of(journalService.getMood(userId, entryDate));
    }

    @PostMapping("/mood")
    public ResponseEntity<?> saveMood(@RequestBody Map<String, String> payload, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate entryDate = LocalDate.parse(payload.get("date"));
        String moodType = payload.get("moodType");
        String notes = payload.get("notes");
        return ResponseEntity.ok(journalService.saveMood(userId, entryDate, moodType, notes));
    }

    @GetMapping("/gratitudes")
    public ResponseEntity<?> getGratitudes(@RequestParam String date, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate entryDate = LocalDate.parse(date);
        return ResponseEntity.ok(journalService.getGratitudes(userId, entryDate));
    }

    @PostMapping("/gratitudes")
    public ResponseEntity<?> addGratitude(@RequestBody Map<String, String> payload, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate entryDate = LocalDate.parse(payload.get("date"));
        String content = payload.get("content");
        return ResponseEntity.ok(journalService.addGratitude(userId, entryDate, content));
    }

    @DeleteMapping("/gratitudes/{gratitudeId}")
    public ResponseEntity<?> deleteGratitude(@PathVariable Long gratitudeId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        journalService.deleteGratitude(gratitudeId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/calendar")
    public ResponseEntity<?> getCalendarEntries(@RequestParam int year, @RequestParam int month, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return ResponseEntity.ok(journalService.getEntriesForMonth(userId, year, month));
    }

    @GetMapping("/insights")
    public ResponseEntity<?> getInsights(@RequestParam String startDate, @RequestParam String endDate,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(journalInsightService.getInsights(userId, start, end));
    }
}
