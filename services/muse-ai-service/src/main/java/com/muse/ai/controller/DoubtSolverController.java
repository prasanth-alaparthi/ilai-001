package com.muse.ai.controller;

import com.muse.ai.service.DoubtSolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Doubt Solver Controller - AI-powered Q&A for students
 */
@RestController
@RequestMapping("/api/doubt-solver")
@RequiredArgsConstructor
@Slf4j
public class DoubtSolverController {

    private final DoubtSolverService doubtSolverService;

    /**
     * Solve a doubt/question
     */
    @PostMapping("/solve")
    public ResponseEntity<Map<String, Object>> solveDoubt(@RequestBody Map<String, Object> request) {
        String question = (String) request.get("question");
        String subject = (String) request.get("subject");

        @SuppressWarnings("unchecked")
        List<String> noteContexts = (List<String>) request.get("noteContexts");

        Long userId = request.get("userId") != null ? ((Number) request.get("userId")).longValue() : null;

        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question is required"));
        }

        // Auto-detect subject if not provided
        if (subject == null || subject.isEmpty()) {
            subject = doubtSolverService.detectSubject(question);
        }

        Map<String, Object> result = doubtSolverService.solveDoubt(question, subject, noteContexts, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * Detect subject from question
     */
    @PostMapping("/detect-subject")
    public ResponseEntity<Map<String, String>> detectSubject(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        if (question == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question is required"));
        }

        String subject = doubtSolverService.detectSubject(question);
        return ResponseEntity.ok(Map.of("subject", subject));
    }

    /**
     * Get follow-up questions based on previous Q&A
     */
    @PostMapping("/follow-up")
    public ResponseEntity<Map<String, Object>> getFollowUpQuestions(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        String answer = request.get("answer");

        if (question == null || answer == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question and answer are required"));
        }

        List<String> followUps = doubtSolverService.generateFollowUpQuestions(question, answer);
        return ResponseEntity.ok(Map.of(
                "followUpQuestions", followUps,
                "originalQuestion", question));
    }

    /**
     * Quick math solver endpoint
     */
    @PostMapping("/math")
    public ResponseEntity<Map<String, Object>> solveMath(@RequestBody Map<String, Object> request) {
        String problem = (String) request.get("problem");
        Long userId = request.get("userId") != null ? ((Number) request.get("userId")).longValue() : null;

        if (problem == null || problem.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Problem is required"));
        }

        Map<String, Object> result = doubtSolverService.solveDoubt(problem, "mathematics", null, userId);
        return ResponseEntity.ok(result);
    }
}
