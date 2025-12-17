package com.muse.ai.repository;

import com.muse.ai.entity.TopicMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicMasteryRepository extends JpaRepository<TopicMastery, Long> {

    List<TopicMastery> findByUserId(Long userId);

    Optional<TopicMastery> findByUserIdAndTopic(Long userId, String topic);

    @Query("SELECT t FROM TopicMastery t WHERE t.userId = :userId ORDER BY t.masteryLevel ASC")
    List<TopicMastery> findWeakestTopics(Long userId);

    @Query("SELECT t FROM TopicMastery t WHERE t.userId = :userId AND t.masteryLevel < :threshold ORDER BY t.masteryLevel ASC")
    List<TopicMastery> findTopicsBelowThreshold(Long userId, Double threshold);

    @Query("SELECT t FROM TopicMastery t WHERE t.userId = :userId ORDER BY t.masteryLevel DESC")
    List<TopicMastery> findStrongestTopics(Long userId);

    @Query("SELECT AVG(t.masteryLevel) FROM TopicMastery t WHERE t.userId = :userId")
    Double getAverageMastery(Long userId);

    long countByUserId(Long userId);
}
