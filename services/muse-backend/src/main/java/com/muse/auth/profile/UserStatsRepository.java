// File: auth-service/src/main/java/com/muse/auth/profile/UserStatsRepository.java
package com.muse.auth.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE UserStats u SET u.followersCount = u.followersCount + 1 WHERE u.userId = :userId")
    void incrementFollowers(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE UserStats u SET u.followersCount = u.followersCount - 1 WHERE u.userId = :userId AND u.followersCount > 0")
    void decrementFollowers(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE UserStats u SET u.followingCount = u.followingCount + 1 WHERE u.userId = :userId")
    void incrementFollowing(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE UserStats u SET u.followingCount = u.followingCount - 1 WHERE u.userId = :userId AND u.followingCount > 0")
    void decrementFollowing(Long userId);
}