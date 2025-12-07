package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.Post;
import com.muse.auth.feed.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPostOrderByCreatedAtAsc(Post post);
}
