package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.Post;
import com.muse.auth.feed.PostStatus;
import com.muse.auth.feed.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByAuthorUsernameAndStatusOrderByCreatedAtDesc(String authorUsername,
                                                                 PostStatus status,
                                                                 Pageable pageable);

    Page<Post> findByVisibilityAndStatusOrderByCreatedAtDesc(PostVisibility visibility,
                                                             PostStatus status,
                                                             Pageable pageable);

    Page<Post> findByStatusOrderByCreatedAtDesc(PostStatus status, Pageable pageable);

    // Mixed feed: public posts + posts authored by user (status=VISIBLE).
    // Extend this query later to include university visibility using universityId param.
    @Query("SELECT p FROM Post p WHERE p.status = :status AND " +
            "(p.visibility = com.muse.auth.feed.PostVisibility.PUBLIC OR p.authorUsername = :username) " +
            "ORDER BY p.createdAt DESC")
    Page<Post> findVisibleMixedForFeed(@Param("username") String username,
                                       @Param("status") PostStatus status,
                                       Pageable pageable);
}
