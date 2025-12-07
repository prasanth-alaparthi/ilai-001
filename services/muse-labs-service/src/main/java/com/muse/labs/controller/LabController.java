package com.muse.labs.controller;

import com.muse.labs.entity.Lab;
import com.muse.labs.entity.UserLabProgress;
import com.muse.labs.service.LabService;
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

    // @Autowired
    // private LabAiService labAiService;

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
    public ResponseEntity<Lab> createLab(@RequestBody Lab lab) {
        // TODO: Add Admin check
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

    // AI Endpoints

    // @PostMapping("/ai/solve")
    // public Mono<ResponseEntity<Map<String, String>>> solveEquation(@RequestBody
    // Map<String, String> body) {
    // String equation = body.get("equation");
    // return labAiService.solveEquation(equation)
    // .map(answer -> ResponseEntity.ok(Map.of("answer", answer)));
    // }

    // @PostMapping("/ai/balance")
    // public Mono<ResponseEntity<Map<String, String>>> balanceReaction(@RequestBody
    // Map<String, String> body) {
    // String reaction = body.get("reaction");
    // return labAiService.balanceReaction(reaction)
    // .map(answer -> ResponseEntity.ok(Map.of("answer", answer)));
    // }

    // @PostMapping("/ai/explain")
    // public Mono<ResponseEntity<Map<String, String>>> explainConcept(@RequestBody
    // Map<String, String> body) {
    // String concept = body.get("concept");
    // return labAiService.explainConcept(concept)
    // .map(answer -> ResponseEntity.ok(Map.of("answer", answer)));
    // }
}
