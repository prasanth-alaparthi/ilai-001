package com.muse.academic.academic.repository;

import com.muse.academic.academic.entity.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    List<ClubMember> findByUserId(Long userId);

    List<ClubMember> findByClubId(Long clubId);

    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);
}
