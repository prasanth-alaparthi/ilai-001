// File: auth-service/src/main/java/com/muse/auth/profile/FollowRepository.java
package com.muse.auth.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    List<Follow> findByFollowerUsernameOrderByCreatedAtDesc(String followerUsername);
    List<Follow> findByFolloweeUsernameOrderByCreatedAtDesc(String followeeUsername);
    Optional<Follow> findByFollowerUsernameAndFolloweeUsername(String follower, String followee);
    long countByFolloweeUsername(String followeeUsername);
    long countByFollowerUsername(String followerUsername);
}