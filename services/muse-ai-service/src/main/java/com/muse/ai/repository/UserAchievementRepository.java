package com.muse.ai.repository;

import com.muse.ai.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    List<UserAchievement> findByUserId(Long userId);

    List<UserAchievement> findByUserIdOrderByEarnedAtDesc(Long userId);

    boolean existsByUserIdAndAchievementId(Long userId, Integer achievementId);

    @Query("SELECT ua.achievement.code FROM UserAchievement ua WHERE ua.userId = :userId")
    List<String> findAchievementCodesByUserId(Long userId);

    long countByUserId(Long userId);

    // Recent achievements across all users (for activity feed)
    @Query("SELECT ua FROM UserAchievement ua ORDER BY ua.earnedAt DESC")
    List<UserAchievement> findRecentAchievements(org.springframework.data.domain.Pageable pageable);
}
