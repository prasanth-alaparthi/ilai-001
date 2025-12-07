package com.muse.academic.service;

import com.muse.academic.entity.*;
import com.muse.academic.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicService {

    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ExamRepository examRepository;
    private final ExamResultRepository examResultRepository;
    private final AttendanceRepository attendanceRepository;
    private final ReviewRepository reviewRepository;

    // --- Classroom ---
    @Transactional
    public Classroom createClassroom(String name, String subject, Long teacherId, Long institutionId) {
        Classroom classroom = Classroom.builder()
                .name(name)
                .subject(subject)
                .teacherId(teacherId)
                .institutionId(institutionId)
                .build();
        return classroomRepository.save(classroom);
    }

    public List<Classroom> getClassroomsByTeacher(Long teacherId) {
        return classroomRepository.findByTeacherId(teacherId);
    }

    public List<Classroom> getClassroomsByStudent(Long studentId) {
        return classMemberRepository.findByStudentId(studentId).stream()
                .map(ClassMember::getClassroom)
                .toList();
    }

    @Transactional
    public void addStudentToClassroom(Long studentId, Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        ClassMember member = ClassMember.builder()
                .classroom(classroom)
                .studentId(studentId)
                .build();
        classMemberRepository.save(member);
    }

    // --- Assignment ---
    @Transactional
    public Assignment createAssignment(Long classroomId, String title, String description) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        Assignment assignment = Assignment.builder()
                .classroom(classroom)
                .title(title)
                .description(description)
                .build();
        return assignmentRepository.save(assignment);
    }

    public List<Assignment> getAssignmentsByClassroom(Long classroomId) {
        return assignmentRepository.findByClassroomId(classroomId);
    }

    // --- Submission ---
    @Transactional
    public Submission submitAssignment(Long assignmentId, Long studentId, String content) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Submission submission = Submission.builder()
                .assignment(assignment)
                .studentId(studentId)
                .content(content)
                .build();
        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    // --- Clubs ---
    @Transactional
    public Club createClub(String name, String description, Long teacherId, Long institutionId) {
        Club club = Club.builder()
                .name(name)
                .description(description)
                .patronTeacherId(teacherId)
                .institutionId(institutionId)
                .build();
        return clubRepository.save(club);
    }

    public List<Club> getClubsByInstitution(Long institutionId) {
        return clubRepository.findByInstitutionId(institutionId);
    }

    @Transactional
    public void joinClub(Long studentId, Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));
        ClubMember member = ClubMember.builder()
                .club(club)
                .studentId(studentId)
                .build();
        clubMemberRepository.save(member);
    }

    public List<Club> getClubsByStudent(Long studentId) {
        return clubMemberRepository.findByStudentId(studentId).stream()
                .map(ClubMember::getClub)
                .toList();
    }

    // --- Projects ---
    @Transactional
    public Project createProject(String title, String description, Long classroomId, Long creatorId) {
        Project project = Project.builder()
                .title(title)
                .description(description)
                .classroomId(classroomId)
                .creatorId(creatorId)
                .build();
        return projectRepository.save(project);
    }

    @Transactional
    public void addStudentToProject(Long studentId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        ProjectMember member = ProjectMember.builder()
                .project(project)
                .studentId(studentId)
                .build();
        projectMemberRepository.save(member);
    }

    public List<Project> getProjectsByStudent(Long studentId) {
        return projectMemberRepository.findByStudentId(studentId).stream()
                .map(ProjectMember::getProject)
                .toList();
    }

    // --- Exams & Results ---
    @Transactional
    public Exam createExam(Long classroomId, String subject, java.time.LocalDate date, String type) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        Exam exam = Exam.builder()
                .classroom(classroom)
                .subject(subject)
                .date(date)
                .type(type)
                .build();
        return examRepository.save(exam);
    }

    @Transactional
    public ExamResult recordExamResult(Long examId, Long studentId, Double marks, Double total, String remarks) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        ExamResult result = ExamResult.builder()
                .exam(exam)
                .studentId(studentId)
                .marksObtained(marks)
                .totalMarks(total)
                .remarks(remarks)
                .build();
        return examResultRepository.save(result);
    }

    public List<ExamResult> getStudentReportCard(Long studentId) {
        return examResultRepository.findByStudentId(studentId);
    }

    public List<Exam> getUpcomingExams(Long classroomId) {
        return examRepository.findByClassroomId(classroomId);
    }

    // --- Attendance ---
    @Transactional
    public void markAttendance(Long classroomId, Long studentId, java.time.LocalDate date, Attendance.Status status) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        Attendance attendance = Attendance.builder()
                .classroom(classroom)
                .studentId(studentId)
                .date(date)
                .status(status)
                .build();
        attendanceRepository.save(attendance);
    }

    public List<Attendance> getStudentAttendance(Long studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    // --- Complaints ---
    private final ComplaintRepository complaintRepository;

    @Transactional
    public Complaint createComplaint(Long institutionId, Long reporterId, String subject, String description) {
        Complaint complaint = Complaint.builder()
                .institutionId(institutionId)
                .reporterId(reporterId)
                .subject(subject)
                .description(description)
                .build();
        return complaintRepository.save(complaint);
    }

    public List<Complaint> getComplaintsByInstitution(Long institutionId) {
        return complaintRepository.findByInstitutionId(institutionId);
    }

    @Transactional
    public void resolveComplaint(Long complaintId, Complaint.Status status) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        complaint.setStatus(status);
        complaintRepository.save(complaint);
    }

    // --- Reviews ---
    @Transactional
    public Review createReview(Long institutionId, Long reviewerId, String reviewerName, Review.TargetType targetType,
            String targetName, Double rating, String comment) {
        Review review = Review.builder()
                .institutionId(institutionId)
                .reviewerId(reviewerId)
                .reviewerName(reviewerName)
                .targetType(targetType)
                .targetName(targetName)
                .rating(rating)
                .comment(comment)
                .build();
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByInstitution(Long institutionId) {
        return reviewRepository.findByInstitutionId(institutionId);
    }

    // --- Stats ---
    public AcademicStats getStats(Long institutionId) {
        // This is a simplified stats implementation.
        // In a real app, you'd use count queries in repositories for performance.
        long totalClubs = clubRepository.findByInstitutionId(institutionId).size();
        // For classrooms, we don't have institutionId directly indexed in the
        // simplified repo,
        // but let's assume we filter or add a method.
        // For now, returning 0 or implementing a custom query is better.
        // Let's assume we add findByInstitutionId to ClassroomRepository.
        long totalClassrooms = classroomRepository.findAll().stream()
                .filter(c -> c.getInstitutionId().equals(institutionId)).count();

        long totalReviews = reviewRepository.findByInstitutionId(institutionId).size();

        return new AcademicStats(totalClassrooms, totalClubs, totalReviews);
    }

    public AdvancedStats getAdvancedStats(Long institutionId) {
        // Mock implementation for high-level stats
        // In a real application, these would be calculated based on historical data,
        // grades, attendance, etc.
        return new AdvancedStats(
                94.5, // Retention Rate
                3.2, // Average GPA
                4.5, // Student Satisfaction (out of 5)
                4.2 // Faculty Performance (out of 5)
        );
    }

    public record AcademicStats(long totalClassrooms, long totalClubs, long totalReviews) {
    }

    public record AdvancedStats(double retentionRate, double averageGPA, double studentSatisfaction,
            double facultyPerformance) {
    }
}
