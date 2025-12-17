package com.muse.social.feed.repository;

import com.muse.social.feed.entity.GroupMember;
import com.muse.social.feed.entity.GroupMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

    List<GroupMember> findByGroupId(UUID groupId);

    List<GroupMember> findByUserId(String userId);

    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, String userId);

    boolean existsByGroupIdAndUserId(UUID groupId, String userId);

    void deleteByGroupIdAndUserId(UUID groupId, String userId);

    @Query("SELECT COUNT(m) FROM GroupMember m WHERE m.groupId = :groupId")
    Long countMembers(@Param("groupId") UUID groupId);

    @Query("SELECT m FROM GroupMember m WHERE m.groupId = :groupId AND m.role IN ('OWNER', 'ADMIN')")
    List<GroupMember> findAdmins(@Param("groupId") UUID groupId);
}
