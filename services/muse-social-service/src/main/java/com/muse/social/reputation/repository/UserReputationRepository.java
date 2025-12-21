package com.muse.social.reputation.repository;

import com.muse.social.reputation.entity.UserReputation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserReputationRepository extends JpaRepository<UserReputation, Long> {

    Optional<UserReputation> findByUserId(Long userId);

    // Leaderboard - top users by score
    @Query("SELECT r FROM UserReputation r ORDER BY r.totalScore DESC")
    List<UserReputation> findTopUsers(org.springframework.data.domain.Pageable pageable);

    // Users with active streaks
    @Query("SELECT r FROM UserReputation r WHERE r.streakDays > 0 ORDER BY r.streakDays DESC")
    List<UserReputation> findActiveStreaks(org.springframework.data.domain.Pageable pageable);

    // Count users at each level
    @Query("SELECT r.level, COUNT(r) FROM UserReputation r GROUP BY r.level ORDER BY r.level")
    List<Object[]> countByLevel();
}
