package com.muse.social.reputation.repository;

import com.muse.social.reputation.entity.ReputationHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReputationHistoryRepository extends JpaRepository<ReputationHistory, Long> {

    // Get recent history for a user
    @Query("SELECT h FROM ReputationHistory h WHERE h.userId = :userId ORDER BY h.createdAt DESC")
    List<ReputationHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Get history by source type
    List<ReputationHistory> findByUserIdAndSourceTypeOrderByCreatedAtDesc(
            Long userId, String sourceType, Pageable pageable);

    // Sum points for a user in date range
    @Query("SELECT COALESCE(SUM(h.pointsChange), 0) FROM ReputationHistory h " +
            "WHERE h.userId = :userId AND h.createdAt >= :since")
    Integer sumPointsSince(Long userId, LocalDateTime since);

    // Count transactions for a user
    long countByUserId(Long userId);

    // Get top earners today
    @Query("SELECT h.userId, SUM(h.pointsChange) as total FROM ReputationHistory h " +
            "WHERE h.createdAt >= :since AND h.pointsChange > 0 " +
            "GROUP BY h.userId ORDER BY total DESC")
    List<Object[]> findTopEarnersToday(LocalDateTime since, Pageable pageable);
}
