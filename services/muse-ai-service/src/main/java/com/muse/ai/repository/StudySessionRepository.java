package com.muse.ai.repository;

import com.muse.ai.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    List<StudySession> findByUserIdOrderByStartedAtDesc(Long userId);

    List<StudySession> findByUserIdAndStartedAtAfter(Long userId, LocalDateTime since);

    @Query("SELECT s FROM StudySession s WHERE s.userId = :userId AND s.endedAt IS NULL")
    List<StudySession> findActiveSessionsByUserId(Long userId);

    @Query("SELECT SUM(s.durationMinutes) FROM StudySession s WHERE s.userId = :userId AND s.startedAt >= :since")
    Integer getTotalStudyMinutesSince(Long userId, LocalDateTime since);

    @Query("SELECT s.sessionType, COUNT(s) FROM StudySession s WHERE s.userId = :userId GROUP BY s.sessionType")
    List<Object[]> getSessionTypeDistribution(Long userId);

    @Query("SELECT s.topic, SUM(s.durationMinutes) FROM StudySession s WHERE s.userId = :userId AND s.topic IS NOT NULL GROUP BY s.topic ORDER BY SUM(s.durationMinutes) DESC")
    List<Object[]> getTopicStudyTime(Long userId);
}
