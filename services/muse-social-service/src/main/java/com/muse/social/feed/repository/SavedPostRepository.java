package com.muse.social.feed.repository;

import com.muse.social.feed.entity.SavedPost;
import com.muse.social.feed.entity.SavedPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {

    List<SavedPost> findByUserId(String userId);

    List<SavedPost> findByUserIdAndCollectionName(String userId, String collectionName);

    Optional<SavedPost> findByUserIdAndPostId(String userId, Long postId);

    boolean existsByUserIdAndPostId(String userId, Long postId);

    @Query("SELECT DISTINCT s.collectionName FROM SavedPost s WHERE s.userId = :userId")
    List<String> findCollectionsByUserId(@Param("userId") String userId);

    void deleteByUserIdAndPostId(String userId, Long postId);
}
