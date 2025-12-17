package com.muse.academic.assignment.repository;

import com.muse.academic.assignment.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignmentId(Long assignmentId);

    List<Submission> findByStudentId(String studentId);

    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, String studentId);
}
