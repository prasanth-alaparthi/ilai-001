package com.muse.auth.auth.controller;

import com.muse.auth.auth.entity.Follow;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.repository.FollowRepository;
import com.muse.auth.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    private Long getUserIdFromRequest() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
            String username = ((UserDetails) authentication.getPrincipal()).getUsername();
            return userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping("/{followingId}")
    public ResponseEntity<?> followUser(@PathVariable Long followingId) {
        Long followerId = getUserIdFromRequest();
        if (followerId.equals(followingId)) {
            return ResponseEntity.badRequest().body("Cannot follow yourself");
        }
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            return ResponseEntity.badRequest().body("Already following");
        }
        Follow follow = Follow.builder()
                .followerId(followerId)
                .followingId(followingId)
                .build();
        followRepository.save(follow);
        return ResponseEntity.ok("Followed successfully");
    }

    @DeleteMapping("/{followingId}")
    public ResponseEntity<?> unfollowUser(@PathVariable Long followingId) {
        Long followerId = getUserIdFromRequest();
        Follow follow = followRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .orElseThrow(() -> new RuntimeException("Not following"));
        followRepository.delete(follow);
        return ResponseEntity.ok("Unfollowed successfully");
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<?> getFollowers(@PathVariable Long userId) {
        List<Long> followerIds = followRepository.findByFollowingId(userId).stream()
                .map(Follow::getFollowerId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(followerIds);
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<?> getFollowing(@PathVariable Long userId) {
        List<Long> followingIds = followRepository.findByFollowerId(userId).stream()
                .map(Follow::getFollowingId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(followingIds);
    }

    @GetMapping("/stats/{userId}")
    public ResponseEntity<?> getStats(@PathVariable Long userId) {
        long followers = followRepository.countByFollowingId(userId);
        long following = followRepository.countByFollowerId(userId);
        return ResponseEntity.ok(Map.of("followers", followers, "following", following));
    }

    @GetMapping("/check/{targetId}")
    public ResponseEntity<?> checkFollow(@PathVariable Long targetId) {
        Long currentUserId = getUserIdFromRequest();
        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUserId, targetId);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }
}
