package com.muse.classroom.repository;

import com.muse.classroom.entity.OnlineClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OnlineClassRepository extends JpaRepository<OnlineClass, Long> {
    List<OnlineClass> findByClassroomId(Long classroomId);
}
