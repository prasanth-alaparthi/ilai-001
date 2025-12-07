package com.muse.academic.repository;

import com.muse.academic.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByClassroomId(Long classroomId);
}
