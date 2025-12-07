package com.muse.assignment.controller;

import com.muse.assignment.dto.AssignmentDTO;
import com.muse.assignment.dto.GradeDTO;
import com.muse.assignment.dto.SubmissionDTO;
import com.muse.assignment.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ResponseEntity<AssignmentDTO> createAssignment(@RequestBody AssignmentDTO dto) {
        return ResponseEntity.ok(assignmentService.createAssignment(dto));
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmissionDTO> submitAssignment(@RequestBody SubmissionDTO dto) {
        return ResponseEntity.ok(assignmentService.submitAssignment(dto));
    }

    @PostMapping("/grade/{submissionId}")
    public Mono<ResponseEntity<GradeDTO>> gradeSubmission(@PathVariable Long submissionId) {
        return assignmentService.gradeSubmission(submissionId)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentDTO>> getAssignmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourse(courseId));
    }

    @GetMapping("/{assignmentId}/submissions")
    public ResponseEntity<List<SubmissionDTO>> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentService.getSubmissionsByAssignment(assignmentId));
    }
}
