package com.muse.academic.academic.repository;

import com.muse.academic.academic.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findByInstitutionId(Long institutionId);

    List<Club> findByPatronTeacherId(Long teacherId);

    List<Club> findByCategoryOrderByMemberCountDesc(String category);

    List<Club> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);

    List<Club> findAllByOrderByMemberCountDesc();
}
