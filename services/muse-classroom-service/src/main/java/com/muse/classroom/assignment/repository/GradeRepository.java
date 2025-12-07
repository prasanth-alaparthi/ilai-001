package com.muse.classroom.assignment.repository;

import com.muse.classroom.assignment.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    Optional<Grade> findBySubmissionId(Long submissionId);
}
