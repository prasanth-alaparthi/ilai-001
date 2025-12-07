package com.muse.academic.repository;

import com.muse.academic.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByClassroomIdAndDate(Long classroomId, LocalDate date);
}
