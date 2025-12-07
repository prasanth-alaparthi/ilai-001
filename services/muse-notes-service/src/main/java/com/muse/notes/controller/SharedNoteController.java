// src/main/java/com/muse/auth/notes/controller/SharedNoteController.java
package com.muse.notes.controller;

import com.muse.notes.entity.SharedNote;
import com.muse.notes.repository.SharedNoteRepository;
import com.muse.notes.repository.NoteRepository;
import com.muse.notes.entity.Note;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
public class SharedNoteController extends BaseController {
    private final SharedNoteRepository sharedRepo;
    private final NoteRepository noteRepo;
    private final String appBase;

    public SharedNoteController(SharedNoteRepository sharedRepo, NoteRepository noteRepo,
                                @Value("${APP_BASE_URL:http://localhost:3000}") String appBase) {
        this.sharedRepo = sharedRepo;
        this.noteRepo = noteRepo;
        this.appBase = appBase;
    }

    @PostMapping("/share/{id}")
    public ResponseEntity<?> share(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        var maybe = noteRepo.findByIdAndOwnerUsername(id, username);
        if (maybe.isEmpty()) return ResponseEntity.notFound().build();

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        SharedNote s = new SharedNote();
        s.setToken(token);
        s.setNoteId(id);
        s.setCreatedAt(Instant.now());
        // default expiry: 30 days
        s.setExpiresAt(Instant.now().plusSeconds(60L * 60 * 24 * 30));
        sharedRepo.save(s);
        String url = appBase.replaceAll("/$", "") + "/shared/" + token;
        return ResponseEntity.ok(Map.of("token", token, "url", url));
    }

    // public endpoint to fetch shared note
    @GetMapping("/shared/{token}")
    public ResponseEntity<?> getShared(@PathVariable String token) {
        var sOpt = sharedRepo.findByToken(token);
        if (sOpt.isEmpty()) return ResponseEntity.notFound().build();
        var s = sOpt.get();
        if (s.getExpiresAt() != null && s.getExpiresAt().isBefore(Instant.now())) {
            return ResponseEntity.status(410).body(Map.of("error", "Link expired"));
        }
        var noteOpt = noteRepo.findById(s.getNoteId());
        if (noteOpt.isEmpty()) return ResponseEntity.notFound().build();
        Note n = noteOpt.get();
        return ResponseEntity.ok(Map.of(
                "id", n.getId(),
                "title", n.getTitle(),
                "content", n.getContent(),
                "authorName", n.getAuthorName()
        ));
    }
}
