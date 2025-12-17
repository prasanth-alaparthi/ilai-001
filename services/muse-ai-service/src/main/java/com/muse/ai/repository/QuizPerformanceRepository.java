package com.muse.ai.repository;

import com.muse.ai.entity.QuizPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizPerformanceRepository extends JpaRepository<QuizPerformance, Long> {

    List<QuizPerformance> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<QuizPerformance> findByUserIdAndTopic(Long userId, String topic);

    @Query("SELECT AVG(q.scorePercentage) FROM QuizPerformance q WHERE q.userId = :userId")
    Double getAverageScore(Long userId);

    @Query("SELECT AVG(q.scorePercentage) FROM QuizPerformance q WHERE q.userId = :userId AND q.topic = :topic")
    Double getAverageScoreByTopic(Long userId, String topic);

    @Query("SELECT q.topic, AVG(q.scorePercentage) FROM QuizPerformance q WHERE q.userId = :userId GROUP BY q.topic ORDER BY AVG(q.scorePercentage) ASC")
    List<Object[]> getWeakestTopicsByQuizScore(Long userId);

    @Query("SELECT q FROM QuizPerformance q WHERE q.userId = :userId AND q.createdAt >= :since ORDER BY q.createdAt DESC")
    List<QuizPerformance> findRecentQuizzes(Long userId, LocalDateTime since);

    long countByUserId(Long userId);
}
