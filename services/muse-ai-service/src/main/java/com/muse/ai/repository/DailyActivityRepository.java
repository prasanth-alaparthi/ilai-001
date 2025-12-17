package com.muse.ai.repository;

import com.muse.ai.entity.DailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyActivityRepository extends JpaRepository<DailyActivity, UUID> {

    Optional<DailyActivity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

    List<DailyActivity> findByUserIdOrderByActivityDateDesc(Long userId);

    List<DailyActivity> findByUserIdAndActivityDateBetween(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT COUNT(da) FROM DailyActivity da WHERE da.userId = :userId AND da.activityDate >= :startDate")
    Long countActiveDaysSince(Long userId, LocalDate startDate);

    @Query("SELECT SUM(da.xpEarned) FROM DailyActivity da WHERE da.userId = :userId AND da.activityDate >= :startDate")
    Long sumXpEarnedSince(Long userId, LocalDate startDate);
}
