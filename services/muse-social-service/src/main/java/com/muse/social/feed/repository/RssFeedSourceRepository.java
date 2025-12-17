package com.muse.social.feed.repository;

import com.muse.social.feed.entity.RssFeedSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RssFeedSourceRepository extends JpaRepository<RssFeedSource, Long> {

    List<RssFeedSource> findByActiveTrue();

    List<RssFeedSource> findByActiveTrueOrderByPriorityDesc();

    List<RssFeedSource> findByCategory(String category);
}
