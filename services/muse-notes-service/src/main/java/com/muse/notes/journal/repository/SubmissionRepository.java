package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.ReviewStatus;
import com.muse.notes.journal.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByCourseCodeAndStatusOrderBySubmittedAtAsc(String courseCode, ReviewStatus status);
}
