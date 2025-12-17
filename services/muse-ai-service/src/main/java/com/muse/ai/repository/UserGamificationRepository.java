package com.muse.ai.repository;

import com.muse.ai.entity.UserGamification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserGamificationRepository extends JpaRepository<UserGamification, UUID> {

    Optional<UserGamification> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    // Leaderboard queries
    @Query("SELECT ug FROM UserGamification ug ORDER BY ug.totalXp DESC")
    List<UserGamification> findTopByXp(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT ug FROM UserGamification ug ORDER BY ug.currentStreak DESC")
    List<UserGamification> findTopByStreak(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT ug FROM UserGamification ug ORDER BY ug.level DESC, ug.totalXp DESC")
    List<UserGamification> findTopByLevel(org.springframework.data.domain.Pageable pageable);

    // Find user's rank
    @Query("SELECT COUNT(ug) + 1 FROM UserGamification ug WHERE ug.totalXp > (SELECT u.totalXp FROM UserGamification u WHERE u.userId = :userId)")
    Long findUserRankByXp(Long userId);

    // Stats queries
    @Query("SELECT SUM(ug.totalXp) FROM UserGamification ug")
    Long getTotalXpAcrossAllUsers();

    @Query("SELECT AVG(ug.currentStreak) FROM UserGamification ug")
    Double getAverageStreak();
}
