package com.muse.social.feed.repository;

import com.muse.social.feed.entity.UserFollow;
import com.muse.social.feed.entity.UserFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {

    // Get who I'm following
    List<UserFollow> findByFollowerId(String followerId);

    // Get my followers
    List<UserFollow> findByFollowingId(String followingId);

    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);

    void deleteByFollowerIdAndFollowingId(String followerId, String followingId);

    @Query("SELECT COUNT(f) FROM UserFollow f WHERE f.followingId = :userId")
    Long countFollowers(@Param("userId") String userId);

    @Query("SELECT COUNT(f) FROM UserFollow f WHERE f.followerId = :userId")
    Long countFollowing(@Param("userId") String userId);

    @Query("SELECT f.followingId FROM UserFollow f WHERE f.followerId = :userId")
    List<String> findFollowingIds(@Param("userId") String userId);

    @Query("SELECT f.followerId FROM UserFollow f WHERE f.followingId = :userId")
    List<String> findFollowerIds(@Param("userId") String userId);
}
