package com.muse.academic.repository;

import com.muse.academic.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findByInstitutionId(Long institutionId);

    List<Club> findByPatronTeacherId(Long teacherId);
}
