package com.muse.notes.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.notes.entity.Note;
import com.muse.notes.entity.NoteLink;
import com.muse.notes.entity.NotePermission;
import com.muse.notes.entity.NoteVersion;
import com.muse.notes.entity.NoteCalendarLink;
import com.muse.notes.entity.NoteSuggestion;
import com.muse.notes.service.NoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class NoteController extends BaseController {

    private final NoteService service;
    private final ObjectMapper objectMapper;

    public NoteController(NoteService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/notes")
    public ResponseEntity<?> list(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.listNotes(username);

        List<Map<String, Object>> dto = notes.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/sections/{sectionId}/notes")
    public ResponseEntity<?> listBySection(@PathVariable Long sectionId, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.listNotesInSection(sectionId, username);

        List<Map<String, Object>> dto = notes.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/sections/{sectionId}/notes")
    public ResponseEntity<?> create(@PathVariable Long sectionId, @RequestBody Map<String, Object> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = (String) payload.get("title");
        JsonNode contentNode;
        try {
            contentNode = objectMapper.valueToTree(payload.get("content"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid content format", "error", e.getMessage()));
        }
        Optional<Note> created = service.createInSection(sectionId, username, title, contentNode);

        if (created.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Section not found"));
        }

        Note note = created.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", note.getId());
        m.put("title", note.getTitle());
        m.put("content", note.getContent());
        m.put("updatedAt", note.getUpdatedAt());

        return ResponseEntity.ok(m);
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canEdit(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to edit this note."));
        }

        String title = (String) payload.get("title");
        JsonNode contentNode;
        try {
            contentNode = objectMapper.valueToTree(payload.get("content"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid content format", "error", e.getMessage()));
        }

        Optional<Note> updated = service.updateNote(id, username, title, contentNode);
        if (updated.isPresent()) {
            Note n = updated.get();
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return ResponseEntity.ok(m);
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        boolean deleted = service.deleteNote(id, username);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(NoteController.class);

    @GetMapping("/notes/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        boolean exists = service.exists(id);
        logger.info("GET /notes/{}: Exists? {}", id, exists);

        if (!exists) {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }

        if (!service.canView(id, username)) {
            logger.warn("GET /notes/{}: Access denied for user {}", id, username);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        Optional<Note> opt = service.getNote(id, username);
        if (opt.isPresent()) {
            Note n = opt.get();
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return ResponseEntity.ok(m);
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }
    }

    @GetMapping("/notes/search")
    public ResponseEntity<?> search(@RequestParam String q, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.searchNotes(username, q);

        List<Map<String, Object>> dto = notes.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/notes/semantic-search")
    public Mono<ResponseEntity<?>> semanticSearch(@RequestParam String q, @RequestParam(defaultValue = "5") int limit,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        return service.semanticSearch(username, q, limit)
                .map(notes -> {
                    List<Map<String, Object>> dto = notes.stream().map(n -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", n.getId());
                        m.put("title", n.getTitle());
                        m.put("content", n.getContent());
                        m.put("updatedAt", n.getUpdatedAt());
                        return m;
                    }).collect(Collectors.toList());
                    return ResponseEntity.ok(dto);
                });
    }

    @PostMapping("/notes/ask")
    public Mono<ResponseEntity<?>> askNotes(@RequestBody com.muse.notes.dto.AskQuestionRequest request,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        return service.askNotes(username, request.getQuestion())
                .map(ResponseEntity::ok);
    }

    @GetMapping("/notes/pinned")
    public ResponseEntity<?> getPinnedNotes(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.getPinnedNotes(username);

        List<Map<String, Object>> dto = notes.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/notes/{id}/toggle-pin")
    public ResponseEntity<?> togglePin(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> updated = service.togglePin(id, username);
        if (updated.isPresent()) {
            Note n = updated.get();
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("isPinned", n.isPinned());
            m.put("updatedAt", n.getUpdatedAt());
            return ResponseEntity.ok(m);
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }
    }

    @PostMapping("/notes/{id}/share")
    public ResponseEntity<?> shareNote(@PathVariable Long id, @RequestBody Map<String, String> payload,
            Authentication auth) {
        String ownerUsername = currentUsername(auth);
        if (ownerUsername == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String sharedWithUsername = payload.get("username");
        NotePermission.PermissionLevel permissionLevel = NotePermission.PermissionLevel
                .valueOf(payload.get("permissionLevel"));

        Optional<NotePermission> permission = service.shareNote(id, ownerUsername, sharedWithUsername, permissionLevel);

        if (permission.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Note shared successfully."));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found or you are not the owner."));
        }
    }

    @GetMapping("/notes/{id}/clean-text")
    public ResponseEntity<?> getCleanText(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        Optional<Note> opt = service.getNote(id, username);
        if (opt.isPresent()) {
            Note n = opt.get();
            StringBuilder textContent = new StringBuilder();
            if (n.getContent() != null) {
                extractText(n.getContent(), textContent);
            }
            return ResponseEntity.ok(Map.of("text", textContent.toString()));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }
    }

    private void extractText(JsonNode node, StringBuilder textContent) {
        if (node.isObject() && node.has("type") && node.get("type").asText().equals("text")) {
            textContent.append(node.get("text").asText()).append(" ");
        }
        if (node.has("content") && node.get("content").isArray()) {
            for (JsonNode child : node.get("content")) {
                extractText(child, textContent);
            }
        }
    }

    @GetMapping("/notes/{id}/versions")
    public ResponseEntity<?> getNoteVersions(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteVersion> versions = service.getNoteVersions(id, username);
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/notes/versions/{versionId}/restore")
    public ResponseEntity<?> restoreNoteVersion(@PathVariable Long versionId, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> restoredNote = service.restoreNoteVersion(versionId, username);
        if (restoredNote.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Note restored successfully."));
        } else {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Version not found or you do not have permission to restore this note."));
        }
    }

    @PostMapping("/notes/reorder")
    public ResponseEntity<?> reorderNotes(@RequestBody List<Long> noteIds, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        service.updateNoteOrder(noteIds, username);
        return ResponseEntity.ok(Map.of("message", "Notes reordered successfully."));
    }

    @GetMapping("/notes/count")
    public ResponseEntity<?> countNotes(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        long count = service.countNotesForUser(username);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/notes/{id}/backlinks")
    public ResponseEntity<?> getBacklinks(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteLink> backlinks = service.getBacklinks(id, username);
        return ResponseEntity.ok(backlinks);
    }

    @GetMapping("/notes/{id}/suggestions")
    public ResponseEntity<?> getNoteSuggestions(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteSuggestion> suggestions = service.getNoteSuggestions(id);
        return ResponseEntity.ok(suggestions);
    }

    @PostMapping("/notes/{id}/calendar-link")
    public ResponseEntity<?> linkNoteToCalendar(@PathVariable Long id, @RequestBody Map<String, String> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canEdit(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to edit this note."));
        }

        String calendarEventId = payload.get("calendarEventId");
        String calendarProvider = payload.get("calendarProvider");

        Optional<NoteCalendarLink> link = service.linkNoteToCalendar(id, username, calendarEventId, calendarProvider);
        if (link.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Note linked to calendar successfully."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Note not found."));
        }
    }

    @GetMapping("/notes/{id}/calendar-links")
    public ResponseEntity<?> getCalendarLinks(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteCalendarLink> links = service.getCalendarLinksForNote(id, username);
        return ResponseEntity.ok(links);
    }

    @DeleteMapping("/notes/calendar-links/{linkId}")
    public ResponseEntity<?> unlinkNoteFromCalendar(@PathVariable Long linkId, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (service.unlinkNoteFromCalendar(linkId, username)) {
            return ResponseEntity.ok(Map.of("message", "Note unlinked from calendar successfully."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Calendar link not found or you do not have permission to unlink it."));
        }
    }
}
