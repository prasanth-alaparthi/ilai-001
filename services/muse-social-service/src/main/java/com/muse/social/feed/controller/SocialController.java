package com.muse.social.feed.controller;

import com.muse.social.feed.dto.*;
import com.muse.social.feed.entity.*;
import com.muse.social.feed.repository.*;
import com.muse.social.feed.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Social Controller - Follow, Friends, Profiles
 */
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
@Slf4j
public class SocialController {

    private final SocialService socialService;
    private final FeedUserProfileRepository profileRepository;
    private final UserFollowRepository followRepository;

    // ==================== Follow ====================

    /**
     * POST /api/social/follow/{userId} - Follow a user
     */
    @PostMapping("/follow/{targetUserId}")
    public ResponseEntity<Map<String, Object>> follow(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String targetUserId) {

        String userId = getUserId(jwt);
        socialService.follow(userId, targetUserId);

        return ResponseEntity.ok(Map.of(
                "following", true,
                "message", "Now following user"));
    }

    /**
     * DELETE /api/social/follow/{userId} - Unfollow a user
     */
    @DeleteMapping("/follow/{targetUserId}")
    public ResponseEntity<Map<String, Object>> unfollow(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String targetUserId) {

        String userId = getUserId(jwt);
        socialService.unfollow(userId, targetUserId);

        return ResponseEntity.ok(Map.of(
                "following", false,
                "message", "Unfollowed user"));
    }

    /**
     * GET /api/social/following - Get who I follow
     */
    @GetMapping("/following")
    public ResponseEntity<List<UserProfileDTO>> getFollowing(@AuthenticationPrincipal Jwt jwt) {
        String userId = getUserId(jwt);
        List<String> followingIds = socialService.getFollowing(userId);

        List<UserProfileDTO> profiles = followingIds.stream()
                .map(id -> profileRepository.findByUserId(id).orElse(null))
                .filter(p -> p != null)
                .map(UserProfileDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(profiles);
    }

    /**
     * GET /api/social/followers - Get my followers
     */
    @GetMapping("/followers")
    public ResponseEntity<List<UserProfileDTO>> getFollowers(@AuthenticationPrincipal Jwt jwt) {
        String userId = getUserId(jwt);
        List<String> followerIds = socialService.getFollowers(userId);

        List<UserProfileDTO> profiles = followerIds.stream()
                .map(id -> profileRepository.findByUserId(id).orElse(null))
                .filter(p -> p != null)
                .map(UserProfileDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(profiles);
    }

    // ==================== Friend Requests ====================

    /**
     * POST /api/social/friend-request/{userId} - Send friend request
     */
    @PostMapping("/friend-request/{targetUserId}")
    public ResponseEntity<Map<String, Object>> sendFriendRequest(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String targetUserId,
            @RequestParam(required = false) String message) {

        String userId = getUserId(jwt);
        FriendRequest request = socialService.sendFriendRequest(userId, targetUserId, message);

        return ResponseEntity.ok(Map.of(
                "requestId", request.getId(),
                "status", "PENDING",
                "message", "Friend request sent"));
    }

    /**
     * POST /api/social/friend-request/{id}/accept - Accept friend request
     */
    @PostMapping("/friend-request/{requestId}/accept")
    public ResponseEntity<Map<String, Object>> acceptFriendRequest(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long requestId) {

        String userId = getUserId(jwt);
        socialService.acceptFriendRequest(requestId, userId);

        return ResponseEntity.ok(Map.of(
                "status", "ACCEPTED",
                "message", "You are now friends!"));
    }

    /**
     * POST /api/social/friend-request/{id}/decline - Decline friend request
     */
    @PostMapping("/friend-request/{requestId}/decline")
    public ResponseEntity<Map<String, Object>> declineFriendRequest(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long requestId) {

        String userId = getUserId(jwt);
        socialService.declineFriendRequest(requestId, userId);

        return ResponseEntity.ok(Map.of(
                "status", "DECLINED",
                "message", "Friend request declined"));
    }

    /**
     * GET /api/social/friend-requests/pending - Get pending requests
     */
    @GetMapping("/friend-requests/pending")
    public ResponseEntity<List<FriendRequest>> getPendingRequests(@AuthenticationPrincipal Jwt jwt) {
        String userId = getUserId(jwt);
        List<FriendRequest> pending = socialService.getPendingRequests(userId);
        return ResponseEntity.ok(pending);
    }

    // ==================== Profiles ====================

    /**
     * GET /api/social/profile/{userId} - Get user profile
     */
    @GetMapping("/profile/{targetUserId}")
    public ResponseEntity<UserProfileDTO> getProfile(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String targetUserId) {

        String userId = getUserId(jwt);

        return profileRepository.findByUserId(targetUserId)
                .map(profile -> {
                    UserProfileDTO dto = UserProfileDTO.fromEntity(profile);
                    dto.setIsFollowing(socialService.isFollowing(userId, targetUserId));
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/social/profile - Update my profile
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UserProfileDTO request) {

        String userId = getUserId(jwt);

        FeedUserProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> FeedUserProfile.builder().userId(userId).build());

        if (request.getDisplayName() != null)
            profile.setDisplayName(request.getDisplayName());
        if (request.getBio() != null)
            profile.setBio(request.getBio());
        if (request.getAvatarUrl() != null)
            profile.setAvatarUrl(request.getAvatarUrl());
        if (request.getCoverImageUrl() != null)
            profile.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getCredentials() != null)
            profile.setCredentials(request.getCredentials());
        if (request.getInstitution() != null)
            profile.setInstitution(request.getInstitution());
        if (request.getEducationLevel() != null)
            profile.setEducationLevel(request.getEducationLevel());
        if (request.getGraduationYear() != null)
            profile.setGraduationYear(request.getGraduationYear());
        if (request.getSubjects() != null)
            profile.setSubjects(request.getSubjects());

        profile = profileRepository.save(profile);

        return ResponseEntity.ok(UserProfileDTO.fromEntity(profile));
    }

    /**
     * GET /api/social/search - Search profiles
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserProfileDTO>> searchProfiles(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit) {

        List<UserProfileDTO> profiles = profileRepository.searchProfiles(q).stream()
                .limit(limit)
                .map(UserProfileDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(profiles);
    }

    // ==================== Helper ====================

    private String getUserId(Jwt jwt) {
        return jwt != null ? jwt.getSubject() : "anonymous";
    }
}
