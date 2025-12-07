package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.FeedItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FeedItemRepository extends JpaRepository<FeedItem, Long> {
    @Query("SELECT f FROM FeedItem f WHERE f.visibility='public' ORDER BY f.publishedAt DESC NULLS LAST, f.createdAt DESC")
    List<FeedItem> findPublicFeed(Pageable pageable);
}