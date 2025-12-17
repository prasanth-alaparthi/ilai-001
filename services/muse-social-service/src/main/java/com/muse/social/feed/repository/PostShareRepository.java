package com.muse.social.feed.repository;

import com.muse.social.feed.entity.PostShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostShareRepository extends JpaRepository<PostShare, Long> {

    List<PostShare> findByPostId(Long postId);

    List<PostShare> findBySharedBy(String sharedBy);

    @Query("SELECT COUNT(s) FROM PostShare s WHERE s.postId = :postId")
    Long countSharesByPostId(@Param("postId") Long postId);

    @Query("SELECT s FROM PostShare s WHERE s.sharedBy = :userId AND s.shareType = 'REPOST'")
    List<PostShare> findRepostsByUser(@Param("userId") String userId);
}
