package com.muse.social.warroom.repository;

import com.muse.social.warroom.entity.StudyRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyRoomRepository extends JpaRepository<StudyRoom, Long> {
    List<StudyRoom> findByIsActiveTrue();

    List<StudyRoom> findBySubjectAndIsActiveTrue(String subject);
}
