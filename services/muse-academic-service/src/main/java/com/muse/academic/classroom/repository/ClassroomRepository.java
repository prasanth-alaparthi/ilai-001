package com.muse.academic.classroom.repository;

import com.muse.academic.classroom.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByTeacherId(Long teacherId);

    List<Classroom> findByInstitutionId(Long institutionId);
}
