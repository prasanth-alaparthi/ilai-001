package com.muse.ai.repository;

import com.muse.ai.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Integer> {

    Optional<Achievement> findByCode(String code);

    List<Achievement> findByCategory(String category);

    List<Achievement> findByTier(String tier);

    List<Achievement> findByIsHiddenFalse();

    List<Achievement> findByCategoryAndIsHiddenFalse(String category);
}
