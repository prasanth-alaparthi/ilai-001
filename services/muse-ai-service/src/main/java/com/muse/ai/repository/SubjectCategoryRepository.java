package com.muse.ai.repository;

import com.muse.ai.entity.SubjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectCategoryRepository extends JpaRepository<SubjectCategory, Long> {

    List<SubjectCategory> findByEnabledTrueOrderByDisplayOrder();

    Optional<SubjectCategory> findByCode(String code);

    boolean existsByCode(String code);
}
