package com.muse.academic.repository;

import com.muse.academic.entity.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    List<ClubMember> findByStudentId(Long studentId);

    List<ClubMember> findByClubId(Long clubId);
}
