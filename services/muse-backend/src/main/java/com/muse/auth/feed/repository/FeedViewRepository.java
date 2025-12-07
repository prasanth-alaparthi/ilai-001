package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.FeedView;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedViewRepository extends JpaRepository<FeedView, Long> {
    List<FeedView> findByFeedItemId(Long feedItemId);
}