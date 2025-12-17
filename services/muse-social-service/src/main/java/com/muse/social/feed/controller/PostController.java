package com.muse.social.feed.controller;

import com.muse.social.feed.client.NotesServiceClient;
import com.muse.social.feed.dto.PostResponse;
import com.muse.social.feed.entity.Post;
import com.muse.social.feed.service.CommentService;
import com.muse.social.feed.service.FileStorageService;
import com.muse.social.feed.service.PostService;
import com.muse.social.feed.service.ReactionService;
import com.muse.social.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/feed/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final NotesServiceClient notesServiceClient;
    private final FileStorageService fileStorageService;
    private final ReactionService reactionService;
    private final CommentService commentService;
    private final com.muse.social.feed.service.NewsService newsService;

    @PostMapping("/fetch-news")
    public ResponseEntity<String> fetchNews() {
        newsService.fetchAndProcessNews();
        return ResponseEntity.ok("News fetch triggered");
    }

    @GetMapping
    public Mono<ResponseEntity<List<PostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        // Return global feed enriched with user info
        return postService.getGlobalFeed(userId, page, size)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/user/{userId}")
    public Mono<ResponseEntity<List<PostResponse>>> getUserPosts(@PathVariable Long userId, Authentication auth) {
        Long currentUserId = AuthUtils.getUserIdFromAuthentication(auth);
        return postService.getPostsForUser(userId, currentUserId)
                .map(ResponseEntity::ok);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Post> createPost(
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "mediaUrls", required = false) List<String> existingMediaUrls,
            @RequestParam(value = "mediaType", required = false) String mediaTypeStr,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);

        List<String> mediaUrls = new ArrayList<>();
        if (existingMediaUrls != null) {
            mediaUrls.addAll(existingMediaUrls);
        }

        Post.MediaType mediaType = Post.MediaType.TEXT;
        if (mediaTypeStr != null) {
            try {
                mediaType = Post.MediaType.valueOf(mediaTypeStr);
            } catch (IllegalArgumentException e) {
                // Default to TEXT if invalid
            }
        }

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String url = fileStorageService.storeFile(file);
                mediaUrls.add(url);
            }
        }

        Post savedPost = postService.createPost(userId, content, tags, mediaUrls, mediaType, null);
        return ResponseEntity.ok(savedPost);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long postId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        if (postService.deletePost(postId, userId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // --- Social Interactions (Convenience Endpoints) ---

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> likePost(@PathVariable Long postId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        // Check if already liked? ReactionService handles duplicates or we can check
        // here.
        // Assuming ReactionService.addReaction handles it or we just add.
        // Frontend expects toggle behavior?
        // For now, let's just add a LIKE reaction.
        return ResponseEntity.ok(reactionService.addReaction(userId, postId, "POST", "LIKE"));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> commentOnPost(@PathVariable Long postId, @RequestBody Map<String, String> payload,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        String content = payload.get("text"); // Frontend sends "text"
        if (content == null)
            content = payload.get("content"); // Fallback
        return ResponseEntity.of(commentService.createComment(postId, userId, content));
    }

    // --- AI Features ---

    @PostMapping("/{postId}/take-note")
    public Mono<ResponseEntity<Map<String, Object>>> takeNoteFromPost(@PathVariable Long postId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        String accessToken = AuthUtils.getAccessToken(auth);

        if (userId == null || accessToken == null) {
            return Mono
                    .just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated")));
        }

        Optional<Post> postOptional = postService.getPostById(postId);
        if (postOptional.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Post not found")));
        }
        Post post = postOptional.get();

        String noteTitle = "Note from Post: " + post.getId();
        String noteContent = post.getContent();

        return notesServiceClient.createNoteFromContent(noteTitle, noteContent, accessToken)
                .map(response -> ResponseEntity.ok(response))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Failed to create note", "error", e.getMessage()))));
    }

    @PostMapping("/{postId}/elaborate")
    public Mono<ResponseEntity<Map<String, Object>>> elaboratePost(@PathVariable Long postId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        String accessToken = AuthUtils.getAccessToken(auth);

        if (userId == null || accessToken == null) {
            return Mono
                    .just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated")));
        }

        Optional<Post> postOptional = postService.getPostById(postId);
        if (postOptional.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Post not found")));
        }
        Post post = postOptional.get();

        return notesServiceClient.elaborateContent(post.getContent(), accessToken)
                .map(response -> ResponseEntity.ok(response))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Failed to get elaboration", "error", e.getMessage()))));
    }

    @GetMapping("/semantic-search")
    public Mono<ResponseEntity<List<PostResponse>>> semanticSearch(@RequestParam String q,
            @RequestParam(defaultValue = "10") int limit, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return postService.semanticSearch(q, limit, userId)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of())));
    }

    @GetMapping("/personalized")
    public Mono<ResponseEntity<List<PostResponse>>> getPersonalizedFeed(@RequestParam(defaultValue = "10") int limit,
            Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        return postService.getPersonalizedFeed(userId, limit)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of())));
    }
}
