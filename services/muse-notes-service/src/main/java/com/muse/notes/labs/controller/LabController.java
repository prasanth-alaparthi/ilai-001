package com.muse.notes.labs.controller;

import com.muse.notes.labs.entity.Lab;
import com.muse.notes.labs.entity.UserLabProgress;
import com.muse.notes.labs.service.LabAiService;
import com.muse.notes.labs.service.LabService;
import com.muse.notes.util.AuthUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labs")
public class LabController {

    @Autowired
    private LabService labService;

    @Autowired
    private LabAiService labAiService;

    @GetMapping
    public ResponseEntity<List<Lab>> getAllLabs(@RequestParam(required = false) String subject) {
        if (subject != null) {
            return ResponseEntity.ok(labService.getLabsBySubject(subject));
        }
        return ResponseEntity.ok(labService.getAllLabs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lab> getLabById(@PathVariable Long id) {
        return ResponseEntity.ok(labService.getLabById(id));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Lab> createLab(@RequestBody Lab lab) {
        return ResponseEntity.ok(labService.createLab(lab));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<UserLabProgress> completeLab(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }
        String userId = jwt.getSubject();
        Integer score = body.get("quizScore");
        return ResponseEntity.ok(labService.completeLab(id, userId, score));
    }

    @GetMapping("/progress")
    public ResponseEntity<List<UserLabProgress>> getProgress(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(labService.getUserProgress(jwt.getSubject()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        String userId = AuthUtils.getUserIdStrFromAuthentication(auth);
        return ResponseEntity.ok(labService.getStats(userId));
    }

    // ==================== Session Persistence ====================

    @PostMapping("/{id}/save-session")
    public ResponseEntity<UserLabProgress> saveSession(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        String userId = AuthUtils.getUserIdStrFromAuthentication(auth);
        String metadataJson = (String) body.get("metadataJson");
        Long runtime = body.containsKey("runtime") ? Long.valueOf(body.get("runtime").toString()) : 0L;
        return ResponseEntity.ok(labService.saveLabSession(id, userId, metadataJson, runtime));
    }

    @GetMapping("/{id}/session")
    public ResponseEntity<UserLabProgress> getSession(@PathVariable Long id, Authentication auth) {
        String userId = AuthUtils.getUserIdStrFromAuthentication(auth);
        return ResponseEntity.ok(labService.getLabSession(id, userId));
    }

    // ==================== AI Features ====================

    @PostMapping("/ai/solve")
    public Mono<ResponseEntity<Map<String, String>>> solve(@RequestBody Map<String, String> body) {
        String equation = body.get("equation");
        return labAiService.solveEquation(equation)
                .map(res -> ResponseEntity.ok(Map.of("solution", res)));
    }

    @PostMapping("/ai/balance")
    public Mono<ResponseEntity<Map<String, String>>> balance(@RequestBody Map<String, String> body) {
        String reaction = body.get("reaction");
        return labAiService.balanceReaction(reaction)
                .map(res -> ResponseEntity.ok(Map.of("balanced", res)));
    }

    @PostMapping("/ai/explain")
    public Mono<ResponseEntity<Map<String, String>>> explain(@RequestBody Map<String, String> body) {
        String concept = body.get("concept");
        return labAiService.explainConcept(concept)
                .map(res -> ResponseEntity.ok(Map.of("explanation", res)));
    }

    // ==================== Export ====================

    @GetMapping("/{id}/export")
    public ResponseEntity<Map<String, Object>> exportResults(@PathVariable Long id, Authentication auth) {
        // Simple export placeholder returning lab info
        Lab lab = labService.getLabById(id);
        return ResponseEntity.ok(Map.of(
                "title", lab.getTitle(),
                "category", lab.getCategory(),
                "exportDate", java.time.Instant.now().toString(),
                "status", "Experimental simulation data"));
    }
}
