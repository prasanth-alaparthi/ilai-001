package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.TeacherCourseMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeacherCourseMappingRepository extends JpaRepository<TeacherCourseMapping, Long> {
    Optional<TeacherCourseMapping> findByTeacherUsernameAndCourseCode(String teacherUsername, String courseCode);
}
