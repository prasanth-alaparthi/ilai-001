package com.muse.notes.labs.controller;

import com.muse.notes.labs.entity.Lab;
import com.muse.notes.labs.entity.UserLabProgress;
import com.muse.notes.labs.service.LabService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labs")
public class LabController {

    @Autowired
    private LabService labService;

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
}
