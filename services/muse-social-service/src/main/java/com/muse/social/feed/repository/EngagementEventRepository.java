package com.muse.social.feed.repository;

import com.muse.social.feed.entity.EngagementEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EngagementEventRepository extends JpaRepository<EngagementEvent, Long> {

    List<EngagementEvent> findByUserIdAndPostId(String userId, Long postId);

    @Query("SELECT e FROM EngagementEvent e WHERE e.userId = :userId AND e.createdAt > :since")
    List<EngagementEvent> findRecentByUserId(@Param("userId") String userId, @Param("since") Instant since);

    @Query("SELECT COUNT(e) FROM EngagementEvent e WHERE e.postId = :postId AND e.eventType = 'VIEW'")
    Long countViewsByPostId(@Param("postId") Long postId);

    @Query("SELECT e.postId, COUNT(e) as cnt FROM EngagementEvent e WHERE e.createdAt > :since GROUP BY e.postId ORDER BY cnt DESC")
    List<Object[]> findTrendingPosts(@Param("since") Instant since);
}
