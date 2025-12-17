package com.muse.academic.classroom.repository;

import com.muse.academic.classroom.entity.OnlineClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OnlineClassRepository extends JpaRepository<OnlineClass, Long> {
    List<OnlineClass> findByClassroomId(Long classroomId);
}
