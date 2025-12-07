package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.Post;
import com.muse.auth.feed.entity.PostShare;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostShareRepository extends JpaRepository<PostShare, Long> {
    long countByPost(Post post);
}

