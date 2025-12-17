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
 * Main Feed Controller - NeuroFeed Algorithm
 */
@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
@Slf4j
public class SmartFeedController {

        private final NeuroFeedEngine neuroFeedEngine;
        private final EngagementTracker engagementTracker;
        private final PostRepository postRepository;
        private final SavedPostRepository savedPostRepository;
        private final UserFollowRepository followRepository;

        /**
         * GET /api/feed - Get personalized feed (NeuroFeed algorithm)
         */
        @GetMapping
        public ResponseEntity<List<FeedPostDTO>> getFeed(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam(defaultValue = "20") int limit,
                        @RequestParam(defaultValue = "0") int offset) {

                String userId = getUserId(jwt);
                List<Post> posts = neuroFeedEngine.generateFeed(userId, limit, offset);

                List<FeedPostDTO> feed = posts.stream()
                                .map(post -> enrichPost(post, userId))
                                .toList();

                return ResponseEntity.ok(feed);
        }

        /**
         * GET /api/feed/trending - Get trending posts
         */
        @GetMapping("/trending")
        public ResponseEntity<List<FeedPostDTO>> getTrending(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam(defaultValue = "20") int limit) {

                String userId = getUserId(jwt);
                List<Post> posts = postRepository.findAll().stream()
                                .sorted((a, b) -> Double.compare(
                                                b.getTrendingScore() != null ? b.getTrendingScore() : 0,
                                                a.getTrendingScore() != null ? a.getTrendingScore() : 0))
                                .limit(limit)
                                .toList();

                List<FeedPostDTO> feed = posts.stream()
                                .map(post -> enrichPost(post, userId))
                                .toList();

                return ResponseEntity.ok(feed);
        }

        /**
         * GET /api/feed/following - Posts from people you follow
         */
        @GetMapping("/following")
        public ResponseEntity<List<FeedPostDTO>> getFollowingFeed(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam(defaultValue = "20") int limit) {

                String userId = getUserId(jwt);
                List<String> followingIds = followRepository.findFollowingIds(userId);

                List<Post> posts = postRepository.findAll().stream()
                                .filter(p -> followingIds.contains(String.valueOf(p.getUserId())))
                                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                                .limit(limit)
                                .toList();

                List<FeedPostDTO> feed = posts.stream()
                                .map(post -> enrichPost(post, userId))
                                .toList();

                return ResponseEntity.ok(feed);
        }

        /**
         * GET /api/feed/hashtag/{tag} - Posts by hashtag
         */
        @GetMapping("/hashtag/{tag}")
        public ResponseEntity<List<FeedPostDTO>> getByHashtag(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable String tag,
                        @RequestParam(defaultValue = "20") int limit) {

                String userId = getUserId(jwt);
                List<Post> posts = postRepository.findAll().stream()
                                .filter(p -> p.getHashtags() != null && p.getHashtags().contains(tag))
                                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                                .limit(limit)
                                .toList();

                List<FeedPostDTO> feed = posts.stream()
                                .map(post -> enrichPost(post, userId))
                                .toList();

                return ResponseEntity.ok(feed);
        }

        /**
         * GET /api/feed/saved - User's saved posts
         */
        @GetMapping("/saved")
        public ResponseEntity<List<FeedPostDTO>> getSaved(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam(required = false) String collection) {

                String userId = getUserId(jwt);
                List<SavedPost> saved = collection != null
                                ? savedPostRepository.findByUserIdAndCollectionName(userId, collection)
                                : savedPostRepository.findByUserId(userId);

                List<FeedPostDTO> feed = saved.stream()
                                .map(s -> postRepository.findById(s.getPostId()).orElse(null))
                                .filter(p -> p != null)
                                .map(post -> enrichPost(post, userId))
                                .toList();

                return ResponseEntity.ok(feed);
        }

        /**
         * POST /api/feed/posts - Create a new post
         */
        @PostMapping("/posts")
        public ResponseEntity<FeedPostDTO> createPost(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestBody CreatePostRequest request) {

                String userId = getUserId(jwt);

                Post post = Post.builder()
                                .userId(Long.parseLong(userId))
                                .content(request.getContent())
                                .hashtags(request.getHashtags())
                                .mediaUrls(request.getMediaUrls())
                                .mediaType(request.getMediaType())
                                .contentType(request.getContentType() != null ? request.getContentType()
                                                : Post.ContentType.INSIGHT)
                                .difficultyLevel(request.getDifficultyLevel() != null ? request.getDifficultyLevel()
                                                : Post.DifficultyLevel.MEDIUM)
                                .visibility(request.getVisibility() != null ? request.getVisibility()
                                                : Post.Visibility.PUBLIC)
                                .groupId(request.getGroupId())
                                .build();

                post = postRepository.save(post);
                log.info("Created post {} by user {}", post.getId(), userId);

                return ResponseEntity.ok(FeedPostDTO.fromEntity(post));
        }

        /**
         * POST /api/feed/posts/{id}/engage - Track engagement (invisible)
         */
        @PostMapping("/posts/{postId}/engage")
        public ResponseEntity<Map<String, String>> trackEngagement(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Long postId,
                        @RequestBody EngagementRequest request) {

                String userId = getUserId(jwt);
                engagementTracker.trackEngagement(
                                userId,
                                postId,
                                request.getEventType(),
                                request.getTimeSpentSeconds(),
                                request.getScrollDepth());

                return ResponseEntity.ok(Map.of("status", "tracked"));
        }

        /**
         * POST /api/feed/posts/{id}/like - Like a post
         */
        @PostMapping("/posts/{postId}/like")
        public ResponseEntity<?> likePost(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Long postId) {

                String userId = getUserId(jwt);
                engagementTracker.trackEngagement(userId, postId, EngagementEvent.EventType.LIKE, null, null);

                return postRepository.findById(postId)
                                .map(post -> {
                                        java.util.HashMap<String, Object> result = new java.util.HashMap<>();
                                        result.put("liked", true);
                                        result.put("likeCount", post.getLikeCount());
                                        return ResponseEntity.ok(result);
                                })
                                .orElse(ResponseEntity.notFound().build());
        }

        /**
         * DELETE /api/feed/posts/{id}/like - Unlike a post
         */
        @DeleteMapping("/posts/{postId}/like")
        public ResponseEntity<?> unlikePost(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Long postId) {

                String userId = getUserId(jwt);
                engagementTracker.trackEngagement(userId, postId, EngagementEvent.EventType.UNLIKE, null, null);

                return postRepository.findById(postId)
                                .map(post -> {
                                        java.util.HashMap<String, Object> result = new java.util.HashMap<>();
                                        result.put("liked", false);
                                        result.put("likeCount", post.getLikeCount());
                                        return ResponseEntity.ok(result);
                                })
                                .orElse(ResponseEntity.notFound().build());
        }

        /**
         * POST /api/feed/posts/{id}/save - Save a post
         */
        @PostMapping("/posts/{postId}/save")
        public ResponseEntity<Map<String, Object>> savePost(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Long postId,
                        @RequestParam(defaultValue = "default") String collection) {

                String userId = getUserId(jwt);

                if (!savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
                        SavedPost saved = SavedPost.builder()
                                        .userId(userId)
                                        .postId(postId)
                                        .collectionName(collection)
                                        .build();
                        savedPostRepository.save(saved);
                        engagementTracker.trackEngagement(userId, postId, EngagementEvent.EventType.SAVE, null, null);
                }

                return ResponseEntity.ok(Map.of("saved", true));
        }

        /**
         * DELETE /api/feed/posts/{id}/save - Unsave a post
         */
        @DeleteMapping("/posts/{postId}/save")
        public ResponseEntity<Map<String, Object>> unsavePost(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Long postId) {

                String userId = getUserId(jwt);
                savedPostRepository.deleteByUserIdAndPostId(userId, postId);
                engagementTracker.trackEngagement(userId, postId, EngagementEvent.EventType.UNSAVE, null, null);

                return ResponseEntity.ok(Map.of("saved", false));
        }

        // ==================== Helper Methods ====================

        private String getUserId(Jwt jwt) {
                return jwt != null ? jwt.getSubject() : "anonymous";
        }

        private FeedPostDTO enrichPost(Post post, String userId) {
                FeedPostDTO dto = FeedPostDTO.fromEntity(post);

                // Add user-specific state
                dto.setIsSaved(savedPostRepository.existsByUserIdAndPostId(userId, post.getId()));
                dto.setIsFollowingAuthor(followRepository.existsByFollowerIdAndFollowingId(
                                userId, String.valueOf(post.getUserId())));

                return dto;
        }
}
