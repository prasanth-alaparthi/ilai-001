package com.muse.social.feed.repository;

import com.muse.social.feed.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudyGroupRepository extends JpaRepository<StudyGroup, UUID> {

    List<StudyGroup> findByVisibility(StudyGroup.GroupVisibility visibility);

    List<StudyGroup> findByGroupType(StudyGroup.GroupType groupType);

    List<StudyGroup> findByCreatedBy(String createdBy);

    @Query("SELECT g FROM StudyGroup g WHERE g.visibility = 'PUBLIC' ORDER BY g.memberCount DESC")
    List<StudyGroup> findPopularPublicGroups();

    @Query("SELECT g FROM StudyGroup g WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')) AND g.visibility = 'PUBLIC'")
    List<StudyGroup> searchGroups(@Param("query") String query);

    @Query("SELECT g FROM StudyGroup g JOIN GroupMember m ON g.id = m.groupId WHERE m.userId = :userId")
    List<StudyGroup> findByMemberId(@Param("userId") String userId);
}
