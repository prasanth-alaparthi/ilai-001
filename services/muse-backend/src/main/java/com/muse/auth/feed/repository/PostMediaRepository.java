package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    // basic JpaRepository methods are sufficient (saveAll is available)
}
