package com.muse.social.feed.repository;

import com.muse.social.feed.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    List<FriendRequest> findByToUserIdAndStatus(String toUserId, FriendRequest.RequestStatus status);

    List<FriendRequest> findByFromUserId(String fromUserId);

    Optional<FriendRequest> findByFromUserIdAndToUserId(String fromUserId, String toUserId);

    boolean existsByFromUserIdAndToUserIdAndStatus(String fromUserId, String toUserId,
            FriendRequest.RequestStatus status);

    @Query("SELECT COUNT(f) FROM FriendRequest f WHERE f.toUserId = :userId AND f.status = 'PENDING'")
    Long countPendingRequests(@Param("userId") String userId);
}
