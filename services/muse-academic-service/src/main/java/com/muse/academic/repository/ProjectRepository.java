package com.muse.academic.repository;

import com.muse.academic.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByClassroomId(Long classroomId);

    List<Project> findByCreatorId(Long creatorId);
}
