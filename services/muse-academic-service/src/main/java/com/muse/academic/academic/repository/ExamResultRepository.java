package com.muse.academic.academic.repository;

import com.muse.academic.academic.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByStudentId(Long studentId);

    List<ExamResult> findByExamId(Long examId);
}
