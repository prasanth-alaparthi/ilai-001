package com.muse.social.feed.service;

import com.muse.social.feed.entity.*;
import com.muse.social.feed.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for social features - follow, friends, block
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SocialService {

    private final UserFollowRepository followRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FeedUserProfileRepository profileRepository;

    // ==================== Follow ====================

    @Transactional
    public void follow(String followerId, String followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        if (!followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            UserFollow follow = UserFollow.builder()
                    .followerId(followerId)
                    .followingId(followingId)
                    .build();
            followRepository.save(follow);

            // Update profile counts
            updateFollowCounts(followerId, followingId, 1);
            log.info("User {} now follows {}", followerId, followingId);
        }
    }

    @Transactional
    public void unfollow(String followerId, String followingId) {
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
            updateFollowCounts(followerId, followingId, -1);
            log.info("User {} unfollowed {}", followerId, followingId);
        }
    }

    public boolean isFollowing(String followerId, String followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    public List<String> getFollowing(String userId) {
        return followRepository.findFollowingIds(userId);
    }

    public List<String> getFollowers(String userId) {
        return followRepository.findFollowerIds(userId);
    }

    // ==================== Friend Requests ====================

    @Transactional
    public FriendRequest sendFriendRequest(String fromUserId, String toUserId, String message) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        // Check if request already exists
        if (friendRequestRepository.existsByFromUserIdAndToUserIdAndStatus(
                fromUserId, toUserId, FriendRequest.RequestStatus.PENDING)) {
            throw new IllegalStateException("Friend request already pending");
        }

        FriendRequest request = FriendRequest.builder()
                .fromUserId(fromUserId)
                .toUserId(toUserId)
                .message(message)
                .status(FriendRequest.RequestStatus.PENDING)
                .build();

        log.info("Friend request sent from {} to {}", fromUserId, toUserId);
        return friendRequestRepository.save(request);
    }

    @Transactional
    public void acceptFriendRequest(Long requestId, String userId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getToUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to accept this request");
        }

        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);

        // Mutual follow (friends follow each other)
        follow(request.getFromUserId(), request.getToUserId());
        follow(request.getToUserId(), request.getFromUserId());

        // Update friend counts
        updateFriendCount(request.getFromUserId(), 1);
        updateFriendCount(request.getToUserId(), 1);

        log.info("Friend request {} accepted", requestId);
    }

    @Transactional
    public void declineFriendRequest(Long requestId, String userId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getToUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to decline this request");
        }

        request.setStatus(FriendRequest.RequestStatus.DECLINED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);

        log.info("Friend request {} declined", requestId);
    }

    public List<FriendRequest> getPendingRequests(String userId) {
        return friendRequestRepository.findByToUserIdAndStatus(userId, FriendRequest.RequestStatus.PENDING);
    }

    // ==================== Helper Methods ====================

    private void updateFollowCounts(String followerId, String followingId, int delta) {
        profileRepository.findByUserId(followerId).ifPresent(profile -> {
            profile.setFollowingCount(profile.getFollowingCount() + delta);
            profileRepository.save(profile);
        });

        profileRepository.findByUserId(followingId).ifPresent(profile -> {
            profile.setFollowerCount(profile.getFollowerCount() + delta);
            profileRepository.save(profile);
        });
    }

    private void updateFriendCount(String userId, int delta) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setFriendCount(profile.getFriendCount() + delta);
            profileRepository.save(profile);
        });
    }
}
