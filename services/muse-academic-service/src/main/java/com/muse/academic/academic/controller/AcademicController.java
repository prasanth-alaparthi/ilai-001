package com.muse.academic.academic.controller;

import com.muse.academic.academic.entity.*;
import com.muse.academic.academic.service.AcademicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/academic")
@RequiredArgsConstructor
public class AcademicController {

    private final AcademicService academicService;

    // --- Classroom Endpoints ---
    @PostMapping("/classrooms")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Classroom> createClassroom(@RequestBody CreateClassroomRequest req) {
        return ResponseEntity
                .ok(academicService.createClassroom(req.name(), req.subject(), req.teacherId(), req.institutionId()));
    }

    @GetMapping("/classrooms/teacher/{teacherId}")
    public ResponseEntity<List<Classroom>> getClassroomsByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(academicService.getClassroomsByTeacher(teacherId));
    }

    @GetMapping("/classrooms/student/{studentId}")
    public ResponseEntity<List<Classroom>> getClassroomsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getClassroomsByStudent(studentId));
    }

    @PostMapping("/classrooms/{classroomId}/students/{studentId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<Void> addStudentToClassroom(@PathVariable Long classroomId, @PathVariable Long studentId) {
        academicService.addStudentToClassroom(studentId, classroomId);
        return ResponseEntity.ok().build();
    }

    // --- Assignment Endpoints ---
    @PostMapping("/classrooms/{classroomId}/assignments")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Assignment> createAssignment(@PathVariable Long classroomId,
            @RequestBody CreateAssignmentRequest req) {
        return ResponseEntity.ok(academicService.createAssignment(classroomId, req.title(), req.description()));
    }

    @GetMapping("/classrooms/{classroomId}/assignments")
    public ResponseEntity<List<Assignment>> getAssignmentsByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(academicService.getAssignmentsByClassroom(classroomId));
    }

    // --- Submission Endpoints ---
    @PostMapping("/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Submission> submitAssignment(@PathVariable Long assignmentId,
            @RequestBody SubmitAssignmentRequest req) {
        return ResponseEntity.ok(academicService.submitAssignment(assignmentId, req.studentId(), req.content()));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<Submission>> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(academicService.getSubmissionsByAssignment(assignmentId));
    }

    // --- Club Endpoints ---
    @PostMapping("/clubs")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Club> createClub(@RequestBody CreateClubRequest req) {
        return ResponseEntity
                .ok(academicService.createClub(req.name(), req.description(), req.teacherId(), req.institutionId()));
    }

    @GetMapping("/clubs/institution/{institutionId}")
    public ResponseEntity<List<Club>> getClubsByInstitution(@PathVariable Long institutionId) {
        return ResponseEntity.ok(academicService.getClubsByInstitution(institutionId));
    }

    @PostMapping("/clubs/{clubId}/join/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> joinClub(@PathVariable Long clubId, @PathVariable Long studentId) {
        academicService.joinClub(studentId, clubId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/clubs/student/{studentId}")
    public ResponseEntity<List<Club>> getClubsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getClubsByStudent(studentId));
    }

    // --- Project Endpoints ---
    @PostMapping("/projects")
    public ResponseEntity<Project> createProject(@RequestBody CreateProjectRequest req) {
        return ResponseEntity
                .ok(academicService.createProject(req.title(), req.description(), req.classroomId(), req.creatorId()));
    }

    @PostMapping("/projects/{projectId}/members/{studentId}")
    public ResponseEntity<Void> addStudentToProject(@PathVariable Long projectId, @PathVariable Long studentId) {
        academicService.addStudentToProject(studentId, projectId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/projects/student/{studentId}")
    public ResponseEntity<List<Project>> getProjectsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getProjectsByStudent(studentId));
    }

    // --- Exam & Report Card Endpoints ---
    @PostMapping("/exams")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Exam> createExam(@RequestBody CreateExamRequest req) {
        return ResponseEntity.ok(academicService.createExam(req.classroomId(), req.subject(), req.date(), req.type()));
    }

    @PostMapping("/exams/{examId}/results")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ExamResult> recordExamResult(@PathVariable Long examId,
            @RequestBody RecordResultRequest req) {
        return ResponseEntity
                .ok(academicService.recordExamResult(examId, req.studentId(), req.marks(), req.total(), req.remarks()));
    }

    @GetMapping("/students/{studentId}/report-card")
    public ResponseEntity<List<ExamResult>> getStudentReportCard(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getStudentReportCard(studentId));
    }

    // --- Attendance Endpoints ---
    @PostMapping("/attendance")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> markAttendance(@RequestBody MarkAttendanceRequest req) {
        academicService.markAttendance(req.classroomId(), req.studentId(), req.date(), req.status());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<List<Attendance>> getStudentAttendance(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getStudentAttendance(studentId));
    }

    // DTOs
    // --- Complaint Endpoints ---
    @PostMapping("/complaints")
    public ResponseEntity<Complaint> createComplaint(@RequestBody CreateComplaintRequest req) {
        return ResponseEntity.ok(academicService.createComplaint(req.institutionId(), req.reporterId(), req.subject(),
                req.description()));
    }

    @GetMapping("/complaints/institution/{institutionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Complaint>> getComplaintsByInstitution(@PathVariable Long institutionId) {
        return ResponseEntity.ok(academicService.getComplaintsByInstitution(institutionId));
    }

    @PostMapping("/complaints/{complaintId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resolveComplaint(@PathVariable Long complaintId,
            @RequestBody ResolveComplaintRequest req) {
        academicService.resolveComplaint(complaintId, req.status());
        return ResponseEntity.ok().build();
    }

    // --- Stats Endpoints ---
    @GetMapping("/stats/institution/{institutionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicService.AcademicStats> getStats(@PathVariable Long institutionId) {
        return ResponseEntity.ok(academicService.getStats(institutionId));
    }

    @GetMapping("/stats/advanced/institution/{institutionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicService.AdvancedStats> getAdvancedStats(@PathVariable Long institutionId) {
        return ResponseEntity.ok(academicService.getAdvancedStats(institutionId));
    }

    // --- Review Endpoints ---
    @PostMapping("/reviews")
    public ResponseEntity<Review> createReview(@RequestBody CreateReviewRequest req) {
        return ResponseEntity.ok(academicService.createReview(req.institutionId(), req.reviewerId(), req.reviewerName(),
                req.targetType(), req.targetName(), req.rating(), req.comment()));
    }

    @GetMapping("/reviews/institution/{institutionId}")
    public ResponseEntity<List<Review>> getReviewsByInstitution(@PathVariable Long institutionId) {
        return ResponseEntity.ok(academicService.getReviewsByInstitution(institutionId));
    }

    // DTOs
    public record CreateClassroomRequest(String name, String subject, Long teacherId, Long institutionId) {
    }

    public record CreateAssignmentRequest(String title, String description) {
    }

    public record SubmitAssignmentRequest(Long studentId, String content) {
    }

    public record CreateClubRequest(String name, String description, Long teacherId, Long institutionId) {
    }

    public record CreateProjectRequest(String title, String description, Long classroomId, Long creatorId) {
    }

    public record CreateExamRequest(Long classroomId, String subject, LocalDate date, String type) {
    }

    public record RecordResultRequest(Long studentId, Double marks, Double total, String remarks) {
    }

    public record MarkAttendanceRequest(Long classroomId, Long studentId, LocalDate date, Attendance.Status status) {
    }

    public record CreateComplaintRequest(Long institutionId, Long reporterId, String subject, String description) {
    }

    public record ResolveComplaintRequest(Complaint.Status status) {
    }

    public record CreateReviewRequest(Long institutionId, Long reviewerId, String reviewerName,
            Review.TargetType targetType, String targetName, Double rating, String comment) {
    }
}
