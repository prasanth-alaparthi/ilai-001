package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.FeedReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedReactionRepository extends JpaRepository<FeedReaction, Long> {
    List<FeedReaction> findByFeedItemId(Long feedItemId);
    Long countByFeedItemIdAndReactionType(Long feedItemId, String reactionType);
    Optional<FeedReaction> findByFeedItemIdAndUsername(Long feedItemId, String username);
}