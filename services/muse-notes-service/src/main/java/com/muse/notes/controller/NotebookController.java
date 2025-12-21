package com.muse.notes.controller;

import com.muse.notes.entity.Notebook;
import com.muse.notes.entity.Section;
import com.muse.notes.service.NotebookService;
import com.muse.notes.service.SectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notebooks")
public class NotebookController extends BaseController {

    private final NotebookService notebookService;
    private final SectionService sectionService;

    public NotebookController(NotebookService notebookService, SectionService sectionService) {
        this.notebookService = notebookService;
        this.sectionService = sectionService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Notebook> notebooks = notebookService.listNotebooks(userId);

        List<Map<String, Object>> dto = notebooks.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("color", n.getColor());
            m.put("updatedAt", n.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> payload, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        String color = payload.get("color");
        Notebook created = notebookService.createNotebook(userId, username, title, color);

        Map<String, Object> m = new HashMap<>();
        m.put("id", created.getId());
        m.put("title", created.getTitle());
        m.put("color", created.getColor());
        m.put("updatedAt", created.getUpdatedAt());

        return ResponseEntity.ok(m);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        String color = payload.get("color");

        Optional<Notebook> updated = notebookService.updateNotebook(id, userId, title, color);
        if (updated.isPresent()) {
            Notebook n = updated.get();
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("color", n.getColor());
            m.put("updatedAt", n.getUpdatedAt());
            return ResponseEntity.ok(m);
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Notebook not found"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        boolean deleted = notebookService.deleteNotebook(id, userId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(404).body(Map.of("message", "Notebook not found"));
    }

    @GetMapping("/{notebookId}/sections")
    public ResponseEntity<?> listSections(@PathVariable Long notebookId,
            @RequestParam(required = false) Boolean hierarchical,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        // If hierarchical=true, return only root sections with children nested
        if (Boolean.TRUE.equals(hierarchical)) {
            List<Section> rootSections = sectionService.listRootSections(notebookId, userId);
            List<Map<String, Object>> dto = rootSections.stream()
                    .map(this::sectionToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dto);
        }

        // Default: flat list for backwards compatibility
        List<Section> sections = sectionService.listSections(notebookId, userId);
        List<Map<String, Object>> dto = sections.stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("title", s.getTitle());
            m.put("updatedAt", s.getUpdatedAt());
            m.put("parentId", s.getParent() != null ? s.getParent().getId() : null);
            m.put("hasChildren", !s.getChildren().isEmpty());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    // Helper to convert Section to nested DTO
    private Map<String, Object> sectionToDto(Section s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("title", s.getTitle());
        m.put("updatedAt", s.getUpdatedAt());
        m.put("parentId", s.getParent() != null ? s.getParent().getId() : null);
        m.put("level", s.getLevel());
        // Recursively include children
        List<Map<String, Object>> childDtos = s.getChildren().stream()
                .map(this::sectionToDto)
                .collect(Collectors.toList());
        m.put("children", childDtos);
        return m;
    }

    // Get children of a specific section
    @GetMapping("/sections/{sectionId}/children")
    public ResponseEntity<?> getChildren(@PathVariable Long sectionId, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Section> children = sectionService.getChildren(sectionId);
        List<Map<String, Object>> dto = children.stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("title", s.getTitle());
            m.put("updatedAt", s.getUpdatedAt());
            m.put("hasChildren", !s.getChildren().isEmpty());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{notebookId}/sections")
    public ResponseEntity<?> createSection(@PathVariable Long notebookId, @RequestBody Map<String, String> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        Optional<Section> created = sectionService.createSection(notebookId, userId, title);

        if (created.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Notebook not found"));
        }

        Section section = created.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", section.getId());
        m.put("title", section.getTitle());
        m.put("updatedAt", section.getUpdatedAt());
        m.put("parentId", null);

        return ResponseEntity.ok(m);
    }

    // Create a sub-section (nested under a parent)
    @PostMapping("/sections/{parentId}/children")
    public ResponseEntity<?> createSubSection(@PathVariable Long parentId, @RequestBody Map<String, String> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        Optional<Section> created = sectionService.createSubSection(parentId, userId, title);

        if (created.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Parent section not found"));
        }

        Section section = created.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", section.getId());
        m.put("title", section.getTitle());
        m.put("updatedAt", section.getUpdatedAt());
        m.put("parentId", parentId);

        return ResponseEntity.ok(m);
    }

    // Move a section to a new parent (or to root)
    @PostMapping("/sections/{sectionId}/move")
    public ResponseEntity<?> moveSection(@PathVariable Long sectionId, @RequestBody Map<String, Long> payload,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Long newParentId = payload.get("parentId"); // null = move to root
        try {
            Optional<Section> moved = sectionService.moveSection(sectionId, newParentId, userId);
            if (moved.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Section not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Section moved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Delete a section and all its children
    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<?> deleteSection(@PathVariable Long sectionId, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        boolean deleted = sectionService.deleteSection(sectionId, userId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(404).body(Map.of("message", "Section not found"));
    }

    @PostMapping("/reorder")
    public ResponseEntity<?> reorderNotebooks(@RequestBody List<Long> notebookIds, Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        notebookService.updateOrder(notebookIds, userId);
        return ResponseEntity.ok(Map.of("message", "Notebooks reordered successfully."));
    }

    @PostMapping("/{notebookId}/sections/reorder")
    public ResponseEntity<?> reorderSections(@PathVariable Long notebookId, @RequestBody List<Long> sectionIds,
            Authentication auth) {
        String username = currentUsername(auth);
        Long userId = currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        sectionService.updateOrder(sectionIds, userId);
        return ResponseEntity.ok(Map.of("message", "Sections reordered successfully."));
    }
}
