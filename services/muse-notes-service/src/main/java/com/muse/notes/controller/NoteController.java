package com.muse.notes.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.notes.entity.Note;
import com.muse.notes.entity.NoteLink;
import com.muse.notes.dto.NoteLinkDto;
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
    private static final int PREVIEW_LENGTH = 300;

    public NoteController(NoteService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/notes")
    public ResponseEntity<?> list(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.listNotes(userId);

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
    public ResponseEntity<?> listInSection(@PathVariable Long sectionId, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.listNotesInSection(sectionId, userId);

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

    @PostMapping("/notes")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> payload, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        logger.info("CREATE NOTE REQUEST: Username: {}, Payload Keys: {}", username, payload.keySet());

        String title = (String) payload.get("title");
        JsonNode contentNode;
        try {
            Object contentObj = payload.get("content");
            if (contentObj == null) {
                logger.warn("Content object is null for note creation");
                contentNode = objectMapper.createObjectNode();
            } else {
                contentNode = objectMapper.valueToTree(contentObj);
            }
            logger.debug("Parsed content node type: {}", contentNode.getNodeType());
        } catch (IllegalArgumentException e) {
            logger.error("Error parsing content for note creation", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid content format", "error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error parsing content", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error processing content", "error", e.getMessage()));
        }

        try {
            Note note = service.createNote(userId, username, title, contentNode);
            logger.info("Note created successfully. ID: {}", note.getId());

            Map<String, Object> m = new HashMap<>();
            m.put("id", note.getId());
            m.put("title", note.getTitle());
            m.put("content", note.getContent());
            m.put("updatedAt", note.getUpdatedAt());

            return ResponseEntity.ok(m);
        } catch (Exception e) {
            logger.error("Error in service.createNote", e);
            throw e;
        }
    }

    @PostMapping("/sections/{sectionId}/notes")
    public ResponseEntity<?> create(@PathVariable Long sectionId, @RequestBody Map<String, Object> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        logger.info("CREATE NOTE IN SECTION request: SectionID: {}, Username: {}", sectionId, username);

        String title = (String) payload.get("title");
        JsonNode contentNode;
        try {
            Object contentObj = payload.get("content");
            if (contentObj == null) {
                logger.warn("Content object is null for note creation in section");
                contentNode = objectMapper.createObjectNode();
            } else {
                contentNode = objectMapper.valueToTree(contentObj);
            }
        } catch (IllegalArgumentException e) {
            logger.error("Error parsing content for note creation in section", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid content format", "error", e.getMessage()));
        }

        Optional<Note> created = service.createInSection(sectionId, userId, username, title, contentNode);

        if (created.isEmpty()) {
            logger.warn("Section not found for note creation: {}", sectionId);
            return ResponseEntity.status(404).body(Map.of("message", "Section not found"));
        }

        Note note = created.get();
        logger.info("Note created successfully in section. ID: {}", note.getId());

        Map<String, Object> m = new HashMap<>();
        m.put("id", note.getId());
        m.put("title", note.getTitle());
        m.put("content", note.getContent());
        m.put("updatedAt", note.getUpdatedAt());

        return ResponseEntity.ok(m);
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        logger.info("UPDATE NOTE REQUEST: ID: {}, Username: {}, UserId: {}", id, username, userId);

        if (!service.canEdit(id, userId)) {
            logger.warn("Permission denied for editing note: {}", id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to edit this note."));
        }

        String title = (String) payload.get("title");
        JsonNode contentNode;
        try {
            Object contentObj = payload.get("content");
            if (contentObj == null) {
                logger.warn("Content object is null for note update");
                contentNode = null;
            } else {
                contentNode = objectMapper.valueToTree(contentObj);
            }
        } catch (IllegalArgumentException e) {
            logger.error("Error parsing content for note update", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid content format", "error", e.getMessage()));
        }

        Optional<Note> updated = service.updateNote(id, userId, title, contentNode);
        if (updated.isPresent()) {
            Note n = updated.get();
            logger.info("Note updated successfully: {}", id);
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("content", n.getContent());
            m.put("updatedAt", n.getUpdatedAt());
            return ResponseEntity.ok(m);
        } else {
            logger.warn("Note not found for update: {}", id);
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        boolean deleted = service.deleteNote(id, userId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(NoteController.class);

    @GetMapping("/notes/{id}")
    public ResponseEntity<?> getNote(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        boolean exists = service.exists(id);
        logger.info("GET /notes/{}: Exists? {}", id, exists);

        if (!exists) {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found"));
        }

        if (!service.canView(id, userId)) {
            logger.warn("GET /notes/{}: Access denied for user ID {}", id, userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        Optional<Note> opt = service.getNote(id, userId);
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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.searchNotes(userId, q);

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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        return service.semanticSearch(userId, q, limit)
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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        return service.askNotes(userId, request.getQuestion())
                .map(ResponseEntity::ok);
    }

    @GetMapping("/notes/pinned")
    public ResponseEntity<?> getPinnedNotes(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Note> notes = service.getPinnedNotes(userId);

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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> updated = service.togglePin(id, userId);
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
    public ResponseEntity<?> shareNote(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            Authentication auth) {
        String ownerUsername = currentUsername(auth);
        Long ownerUserId = currentUserId(auth);
        if (ownerUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String sharedWithUsername = (String) payload.get("username");
        Object swuId = payload.get("userId");
        Long sharedWithUserId = null;
        if (swuId instanceof Number) {
            sharedWithUserId = ((Number) swuId).longValue();
        } else if (swuId instanceof String) {
            sharedWithUserId = Long.parseLong((String) swuId);
        }

        NotePermission.PermissionLevel permissionLevel = NotePermission.PermissionLevel
                .valueOf((String) payload.get("permissionLevel"));

        Optional<NotePermission> permission = service.shareNote(id, ownerUserId, sharedWithUserId, sharedWithUsername,
                permissionLevel);

        if (permission.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Note shared successfully."));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Note not found or you are not the owner."));
        }
    }

    @GetMapping("/notes/{id}/clean-text")
    public ResponseEntity<?> getCleanText(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        Optional<Note> opt = service.getNote(id, userId);
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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteVersion> versions = service.getNoteVersions(id, userId);
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/notes/versions/{versionId}/restore")
    public ResponseEntity<?> restoreNoteVersion(@PathVariable Long versionId, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Optional<Note> restoredNote = service.restoreNoteVersion(versionId, userId);
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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        service.updateNoteOrder(noteIds, userId);
        return ResponseEntity.ok(Map.of("message", "Notes reordered successfully."));
    }

    @GetMapping("/notes/count")
    public ResponseEntity<?> countNotes(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        long count = service.countNotesForUser(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/notes/{id}/backlinks")
    public ResponseEntity<?> getBacklinks(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteLink> backlinks = service.getBacklinks(id, userId);
        return ResponseEntity.ok(backlinks);
    }

    @GetMapping("/notes/{id}/links")
    public ResponseEntity<?> getAllLinks(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        return ResponseEntity.ok(service.getAllLinks(id, userId));
    }

    @GetMapping("/notes/graph")
    public ResponseEntity<?> getUserGraph(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(service.getUserGraph(userId));
    }

    @GetMapping("/notes/broken-links")
    public ResponseEntity<?> getBrokenLinks(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(service.getBrokenLinks(userId));
    }

    @PostMapping("/notes/{id}/links/{targetId}")
    public ResponseEntity<?> createManualLink(@PathVariable Long id, @PathVariable Long targetId,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canEdit(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to edit this note."));
        }

        return service.createManualLink(id, targetId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/notes/{id}/links/{targetId}")
    public ResponseEntity<?> removeManualLink(@PathVariable Long id, @PathVariable Long targetId,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canEdit(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to edit this note."));
        }

        if (service.removeManualLink(id, targetId, userId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/notes/{id}/suggestions")
    public ResponseEntity<?> getNoteSuggestions(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, userId)) {
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
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canEdit(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to edit this note."));
        }

        String calendarEventId = payload.get("calendarEventId");
        String calendarProvider = payload.get("calendarProvider");

        Optional<NoteCalendarLink> link = service.linkNoteToCalendar(id, userId, calendarEventId, calendarProvider);
        if (link.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Note linked to calendar successfully."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Note not found."));
        }
    }

    @GetMapping("/notes/{id}/calendar-links")
    public ResponseEntity<?> getCalendarLinks(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (!service.canView(id, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You do not have permission to view this note."));
        }

        List<NoteCalendarLink> links = service.getCalendarLinksForNote(id, userId);
        return ResponseEntity.ok(links);
    }

    @DeleteMapping("/notes/calendar-links/{linkId}")
    public ResponseEntity<?> unlinkNoteFromCalendar(@PathVariable Long linkId, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        if (service.unlinkNoteFromCalendar(linkId, userId)) {
            return ResponseEntity.ok(Map.of("message", "Note unlinked from calendar successfully."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Calendar link not found or you do not have permission to unlink it."));
        }
    }

    // ==================== Trash / Soft Delete ====================

    @PostMapping("/notes/{id}/trash")
    public ResponseEntity<?> moveToTrash(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        if (service.moveToTrash(id, userId)) {
            return ResponseEntity.ok(Map.of("message", "Note moved to trash"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Note not found"));
    }

    @PostMapping("/notes/{id}/restore")
    public ResponseEntity<?> restoreFromTrash(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        if (service.restoreFromTrash(id, userId)) {
            return ResponseEntity.ok(Map.of("message", "Note restored from trash"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Note not found or not in trash"));
    }

    @GetMapping("/notes/trash")
    public ResponseEntity<?> getTrash(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(service.getTrash(userId));
    }

    @DeleteMapping("/notes/trash")
    public ResponseEntity<?> emptyTrash(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        int count = service.emptyTrash(userId);
        return ResponseEntity.ok(Map.of("message", count + " notes permanently deleted"));
    }

    // ==================== Tags ====================

    @PutMapping("/notes/{id}/tags")
    public ResponseEntity<?> updateTags(@PathVariable Long id, @RequestBody Map<String, Object> body,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        @SuppressWarnings("unchecked")
        java.util.List<String> tagList = (java.util.List<String>) body.get("tags");
        String[] tags = tagList != null ? tagList.toArray(new String[0]) : new String[0];

        return service.updateTags(id, userId, tags)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/notes/by-tag/{tag}")
    public ResponseEntity<?> getNotesByTag(@PathVariable String tag, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(service.getNotesByTag(userId, tag));
    }

    // ==================== Duplicate ====================

    @PostMapping("/notes/{id}/duplicate")
    public ResponseEntity<?> duplicateNote(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return service.duplicateNote(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/notes/preview")
    public ResponseEntity<?> getPreviewByTitle(@RequestParam String title, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null)
            return ResponseEntity.status(401).build();

        Optional<Note> noteOpt = service.findByTitle(userId, title);
        if (noteOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Note n = noteOpt.get();
        Map<String, Object> preview = new HashMap<>();
        preview.put("id", n.getId());
        preview.put("title", n.getTitle());
        preview.put("updatedAt", n.getUpdatedAt());

        // Extract snippet
        String fullText = service.extractTextFromNode(n.getContent());
        String snippet = fullText.length() > PREVIEW_LENGTH
                ? fullText.substring(0, PREVIEW_LENGTH) + "..."
                : fullText;
        preview.put("preview", snippet);

        return ResponseEntity.ok(preview);
    }
}
