package com.muse.academic.classroom.repository;

import com.muse.academic.classroom.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findByClubIdOrderBySentAtAsc(Long clubId);

    List<GroupMessage> findByClassroomIdOrderBySentAtAsc(Long classroomId);
}
