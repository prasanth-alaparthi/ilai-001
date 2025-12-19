package com.muse.notes.journal.controller;

import com.muse.notes.journal.entity.JournalReminder;
import com.muse.notes.journal.entity.MoodEntry;
import com.muse.notes.journal.repository.JournalReminderRepository;
import com.muse.notes.journal.repository.MoodEntryRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal")
public class JournalExtendedController {

    private final JournalReminderRepository reminderRepo;
    private final MoodEntryRepository moodRepo;
    private final com.muse.notes.journal.repository.JournalEntryRepository entryRepo;
    private final com.muse.notes.service.GeminiService geminiService;

    public JournalExtendedController(JournalReminderRepository reminderRepo,
            MoodEntryRepository moodRepo,
            com.muse.notes.journal.repository.JournalEntryRepository entryRepo,
            com.muse.notes.service.GeminiService geminiService) {
        this.reminderRepo = reminderRepo;
        this.moodRepo = moodRepo;
        this.entryRepo = entryRepo;
        this.geminiService = geminiService;
    }

    private String currentUsername(Authentication auth) {
        if (auth == null)
            return null;
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            return jwt.getSubject();
        }
        return auth.getName();
    }

    // Reminders
    @PostMapping("/{journalId}/reminder")
    public ResponseEntity<?> createReminder(@PathVariable Long journalId, @RequestBody Map<String, Object> body,
            Authentication auth) {
        String user = currentUsername(auth);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "unauthenticated"));
        Object dt = body.get("remindAt");
        if (dt == null)
            return ResponseEntity.badRequest().body(Map.of("message", "remindAt required"));
        Instant remindAt = Instant.parse(dt.toString());
        String repeat = (String) body.getOrDefault("repeat", "none");
        JournalReminder r = new JournalReminder();
        r.setJournalId(journalId);
        r.setUsername(user);
        r.setRemindAt(remindAt);
        r.setRepeatRule(repeat);
        reminderRepo.save(r);
        return ResponseEntity.ok(Map.of("reminder", r));
    }

    @GetMapping("/reminders")
    public ResponseEntity<?> myReminders(Authentication auth) {
        String user = currentUsername(auth);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "unauthenticated"));
        List<JournalReminder> list = reminderRepo.findByUsernameOrderByRemindAtDesc(user);
        return ResponseEntity.ok(Map.of("items", list));
    }

    // Mood entries
    @PostMapping("/{journalId}/mood")
    public ResponseEntity<?> addMood(@PathVariable Long journalId, @RequestBody Map<String, Object> body,
            Authentication auth) {
        String user = currentUsername(auth);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "unauthenticated"));
        String mood = (String) body.getOrDefault("mood", "neutral");
        Integer intensity = (Integer) body.getOrDefault("intensity", 5);
        String note = (String) body.getOrDefault("note", "");
        MoodEntry me = new MoodEntry();
        me.setJournalId(journalId);
        me.setUsername(user);
        me.setMood(mood);
        me.setIntensity(intensity);
        me.setNote(note);
        me.setCreatedAt(Instant.now());
        moodRepo.save(me);
        return ResponseEntity.ok(Map.of("mood", me));
    }

    // =====================================================================
    // MOOD TRENDS VISUALIZATION - COMMENTED OUT
    // Reason: Raw data capture works but no frontend visualization (charts/graphs)
    // TODO: Implement when frontend chart components are ready
    // =====================================================================
    /*
     * @GetMapping("/mood/summary")
     * public ResponseEntity<?> moodSummary(@RequestParam(required = false) String
     * username,
     * 
     * @RequestParam(defaultValue = "7") int days,
     * Authentication auth) {
     * // returns counts per mood for last `days`
     * String user = username;
     * if (user == null)
     * user = currentUsername(auth);
     * if (user == null)
     * return ResponseEntity.badRequest().body(Map.of("message",
     * "username required"));
     * 
     * Instant since = Instant.now().minusSeconds((long) days * 86400L);
     * List<MoodEntry> list = moodRepo.findByUsernameAndCreatedAtAfter(user, since);
     * Map<String, Integer> counts = new HashMap<>();
     * for (MoodEntry m : list)
     * counts.put(m.getMood(), counts.getOrDefault(m.getMood(), 0) + 1);
     * return ResponseEntity.ok(Map.of("since", since.toString(), "counts",
     * counts));
     * }
     */

    // Podcast TTS builder
    @PostMapping("/{journalId}/podcast")
    public ResponseEntity<?> buildPodcast(@PathVariable Long journalId, Authentication auth) {
        String user = currentUsername(auth);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "unauthenticated"));

        return entryRepo.findById(journalId)
                .map(entry -> {
                    String prompt = "Create a 2-minute engaging podcast script for this journal entry titled '"
                            + entry.getTitle() + "'. Content: " + entry.getContentJson();
                    String summary = geminiService.generateContent(prompt).block();
                    String ttsUrl = "/api/ai/tts?text="
                            + java.net.URLEncoder.encode(summary, java.nio.charset.StandardCharsets.UTF_8);

                    return ResponseEntity.ok(Map.of(
                            "playlist", List.of(Map.of(
                                    "title", "Audio Insight: " + entry.getTitle(),
                                    "url", ttsUrl,
                                    "script", summary))));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
