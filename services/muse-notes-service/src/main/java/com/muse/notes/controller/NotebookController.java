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
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Notebook> notebooks = notebookService.listNotebooks(username);

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
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        String color = payload.get("color");
        Notebook created = notebookService.createNotebook(username, title, color);

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
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        String color = payload.get("color");

        Optional<Notebook> updated = notebookService.updateNotebook(id, username, title, color);
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
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        boolean deleted = notebookService.deleteNotebook(id, username);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(404).body(Map.of("message", "Notebook not found"));
    }

    @GetMapping("/{notebookId}/sections")
    public ResponseEntity<?> listSections(@PathVariable Long notebookId, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<Section> sections = sectionService.listSections(notebookId, username);

        List<Map<String, Object>> dto = sections.stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("title", s.getTitle());
            m.put("updatedAt", s.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{notebookId}/sections")
    public ResponseEntity<?> createSection(@PathVariable Long notebookId, @RequestBody Map<String, String> payload, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String title = payload.get("title");
        Optional<Section> created = sectionService.createSection(notebookId, username, title);

        if (created.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Notebook not found"));
        }

        Section section = created.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", section.getId());
        m.put("title", section.getTitle());
        m.put("updatedAt", section.getUpdatedAt());

        return ResponseEntity.ok(m);
    }

    @PostMapping("/reorder")
    public ResponseEntity<?> reorderNotebooks(@RequestBody List<Long> notebookIds, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        notebookService.updateOrder(notebookIds, username);
        return ResponseEntity.ok(Map.of("message", "Notebooks reordered successfully."));
    }

    @PostMapping("/{notebookId}/sections/reorder")
    public ResponseEntity<?> reorderSections(@PathVariable Long notebookId, @RequestBody List<Long> sectionIds, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        sectionService.updateOrder(sectionIds, username);
        return ResponseEntity.ok(Map.of("message", "Sections reordered successfully."));
    }
}
