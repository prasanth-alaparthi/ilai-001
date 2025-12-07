package com.muse.journal.controller;

import com.muse.journal.entity.Template;
import com.muse.journal.repository.TemplateRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateRepository repo;

    public TemplateController(TemplateRepository repo) {
        this.repo = repo;
    }

    private String currentUsername(Authentication auth) {
        // We can use AuthUtils to get userId, but this controller uses username.
        // Let's see if we can get username from AuthUtils or just extract it here.
        // The original code extracted it from Principal.
        if (auth == null)
            return "anonymous";
        // For now, let's rely on the JWT subject or similar if AuthUtils doesn't
        // provide username directly.
        // But wait, the original code used UserDetails or toString.
        // In the new service, we are using JWT.
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            return jwt.getSubject();
        }
        return auth.getName();
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        String user = currentUsername(auth);
        List<Template> list = repo.findByOwnerUsernameOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> payload, Authentication auth) {
        String user = currentUsername(auth);
        String title = payload.get("title");
        String content = payload.get("content");
        Template t = new Template();
        t.setOwnerUsername(user);
        t.setTitle(title);
        t.setContent(content);
        repo.save(t);
        return ResponseEntity.ok(t);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        String user = currentUsername(auth);
        return repo.findById(id).map(t -> {
            if (!t.getOwnerUsername().equals(user))
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            repo.delete(t);
            return ResponseEntity.noContent().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
