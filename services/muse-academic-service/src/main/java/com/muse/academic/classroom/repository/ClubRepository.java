package com.muse.academic.classroom.repository;

import com.muse.academic.classroom.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findByInstitutionId(Long institutionId);
}
