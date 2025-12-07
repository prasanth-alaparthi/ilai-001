package com.muse.academic.repository;

import com.muse.academic.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByTeacherId(Long teacherId);

    List<Classroom> findByInstitutionId(Long institutionId);
}
