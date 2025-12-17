package com.muse.ai.repository;

import com.muse.ai.entity.EducationalSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EducationalSourceRepository extends JpaRepository<EducationalSource, Long> {

    List<EducationalSource> findByEnabledTrueOrderByDisplayOrder();

    List<EducationalSource> findByCategoryAndEnabledTrueOrderByDisplayOrder(String category);

    Optional<EducationalSource> findByCode(String code);

    boolean existsByCode(String code);

    /**
     * Find sources that apply to a specific subject
     */
    @Query("SELECT e FROM EducationalSource e WHERE e.enabled = true " +
            "AND (e.subjects IS NULL OR e.subjects = '' OR e.subjects = 'all' " +
            "OR LOWER(e.subjects) LIKE LOWER(CONCAT('%', :subject, '%'))) " +
            "ORDER BY e.displayOrder")
    List<EducationalSource> findBySubject(@Param("subject") String subject);

    /**
     * Find non-premium sources (for free users)
     */
    List<EducationalSource> findByEnabledTrueAndIsPremiumFalseOrderByDisplayOrder();
}
