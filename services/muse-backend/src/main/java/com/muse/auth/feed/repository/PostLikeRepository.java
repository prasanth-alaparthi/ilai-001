package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.Post;
import com.muse.auth.feed.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByPostAndUsername(Post post, String username);

    long countByPost(Post post);

    boolean existsByPostAndUsername(Post post, String username);
}
