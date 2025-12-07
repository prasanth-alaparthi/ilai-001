package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.FeedBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface FeedBookmarkRepository extends JpaRepository<FeedBookmark, Long> {
    Optional<FeedBookmark> findByFeedItemIdAndUsername(Long feedItemId, String username);
    List<FeedBookmark> findByUsernameOrderByCreatedAtDesc(String username);
}