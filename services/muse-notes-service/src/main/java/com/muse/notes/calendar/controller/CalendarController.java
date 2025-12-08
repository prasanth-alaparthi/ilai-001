package com.muse.notes.calendar.controller;

import com.muse.notes.calendar.entity.CalendarEvent;
import com.muse.notes.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController extends BaseController {

    private final CalendarService service;

    @GetMapping("/events")
    public ResponseEntity<?> getEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            @RequestParam(required = false, defaultValue = "false") boolean unscheduled,
            Authentication auth) {
        String userId = currentUsername(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        if (unscheduled) {
            return ResponseEntity.ok(service.getUnscheduledEvents(userId));
        }
        if (start == null || end == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Start and end time required for scheduled events"));
        }
        List<CalendarEvent> events = service.getEvents(userId, start, end);
        return ResponseEntity.ok(events);
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody CalendarEvent event, Authentication auth) {
        String userId = currentUsername(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        CalendarEvent created = service.createEvent(userId, event);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody CalendarEvent event, Authentication auth) {
        String userId = currentUsername(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        try {
            CalendarEvent updated = service.updateEvent(userId, id, event);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, Authentication auth) {
        String userId = currentUsername(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        try {
            service.deleteEvent(userId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }
}
