package com.muse.assignment.service;

import com.muse.assignment.dto.AssignmentDTO;
import com.muse.assignment.dto.GradeDTO;
import com.muse.assignment.dto.SubmissionDTO;
import com.muse.assignment.entity.Assignment;
import com.muse.assignment.entity.Grade;
import com.muse.assignment.entity.Submission;
import com.muse.assignment.repository.AssignmentRepository;
import com.muse.assignment.repository.GradeRepository;
import com.muse.assignment.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;
    private final GeminiService geminiService;

    public AssignmentService(AssignmentRepository assignmentRepository,
            SubmissionRepository submissionRepository,
            GradeRepository gradeRepository,
            GeminiService geminiService) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.gradeRepository = gradeRepository;
        this.geminiService = geminiService;
    }

    public AssignmentDTO createAssignment(AssignmentDTO dto) {
        Assignment assignment = Assignment.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .criteria(dto.getCriteria())
                .dueDate(dto.getDueDate())
                .maxScore(dto.getMaxScore())
                .courseId(dto.getCourseId())
                .teacherId(dto.getTeacherId())
                .build();
        assignment = assignmentRepository.save(assignment);
        return mapToDTO(assignment);
    }

    public SubmissionDTO submitAssignment(SubmissionDTO dto) {
        Assignment assignment = assignmentRepository.findById(dto.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Submission submission = Submission.builder()
                .assignment(assignment)
                .studentId(dto.getStudentId())
                .content(dto.getContent())
                .build();
        submission = submissionRepository.save(submission);
        return mapToDTO(submission);
    }

    public Mono<GradeDTO> gradeSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        // Check if already graded
        if (gradeRepository.findBySubmissionId(submissionId).isPresent()) {
            return Mono.just(mapToDTO(gradeRepository.findBySubmissionId(submissionId).get()));
        }

        Assignment assignment = submission.getAssignment();

        return geminiService.gradeSubmission(
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getCriteria(),
                submission.getContent(),
                assignment.getMaxScore()).map(result -> {
                    Grade grade = Grade.builder()
                            .submission(submission)
                            .score(result.score)
                            .feedback(result.feedback)
                            .graderType(Grade.GraderType.AI)
                            .build();
                    grade = gradeRepository.save(grade);
                    return mapToDTO(grade);
                });
    }

    public List<AssignmentDTO> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourseId(courseId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<SubmissionDTO> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private AssignmentDTO mapToDTO(Assignment assignment) {
        return AssignmentDTO.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .criteria(assignment.getCriteria())
                .dueDate(assignment.getDueDate())
                .maxScore(assignment.getMaxScore())
                .courseId(assignment.getCourseId())
                .teacherId(assignment.getTeacherId())
                .createdAt(assignment.getCreatedAt())
                .build();
    }

    private SubmissionDTO mapToDTO(Submission submission) {
        return SubmissionDTO.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .studentId(submission.getStudentId())
                .content(submission.getContent())
                .submissionDate(submission.getSubmissionDate())
                .build();
    }

    private GradeDTO mapToDTO(Grade grade) {
        return GradeDTO.builder()
                .id(grade.getId())
                .submissionId(grade.getSubmission().getId())
                .score(grade.getScore())
                .feedback(grade.getFeedback())
                .graderType(grade.getGraderType())
                .gradedDate(grade.getGradedDate())
                .build();
    }
}
