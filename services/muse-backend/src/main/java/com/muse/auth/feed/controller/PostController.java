package com.muse.auth.feed.controller;

import com.muse.auth.feed.entity.PostShare;
import com.muse.auth.feed.entity.PostComment;
import com.muse.auth.feed.PostVisibility;
import com.muse.auth.feed.entity.Post;
import com.muse.auth.feed.entity.PostMedia;
import com.muse.auth.feed.service.FeedService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class PostController {

private final FeedService feedService;

private String currentUsername(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return null;
        return auth.getPrincipal().toString();
    }

private Map<String, Object> postDto(Post p, String currentUser) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("authorUsername", p.getAuthorUsername());
        m.put("contentText", p.getContentText());
        m.put("language", p.getLanguage());
        m.put("visibility", p.getVisibility());
        m.put("createdAt", p.getCreatedAt());
        m.put("updatedAt", p.getUpdatedAt());

List<Map<String, Object>> media = new ArrayList<>();
        for (PostMedia pm : p.getMediaList()) {
            Map<String, Object> mm = new HashMap<>();
            mm.put("id", pm.getId());
            mm.put("url", pm.getUrl());
            mm.put("type", pm.getType());
            mm.put("mimeType", pm.getMimeType());
            mm.put("sizeBytes", pm.getSizeBytes());
            media.add(mm);
        }
        m.put("media", media);

long likeCount = feedService.countLikes(p);
        long shareCount = feedService.countShares(p);
        boolean likedByMe = currentUser != null && feedService.isLikedBy(p, currentUser);

m.put("likeCount", likeCount);
        m.put("shareCount", shareCount);
        m.put("likedByMe", likedByMe);

return m;
    }

@PostMapping(value = "/posts", consumes = {"multipart/form-data"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPost(@RequestPart(name = "content", required = false) String content,
                                        @RequestPart(name = "language", required = false) String language,
                                        @RequestPart(name = "visibility", required = false) String visibilityStr,
                                        @RequestPart(name = "files", required = false) List<MultipartFile> files,
                                        Authentication auth) throws IOException {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

PostVisibility visibility = PostVisibility.PUBLIC;
        if (visibilityStr != null && !visibilityStr.isBlank()) {
            try {
                visibility = PostVisibility.valueOf(visibilityStr);
            } catch (IllegalArgumentException ignored) {
            }
        }

// TODO: get universityId from current user's profile if available
        Long universityId = null;

try {
            Post created = feedService.createPost(
                    username,
                    content,
                    language,
                    visibility,
                    files,
                    universityId
            );
            Map<String, Object> dto = postDto(created, username);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", ex.getMessage()
            ));
        }
    }

/* ===== Feed listing with pagination & scope ===== */

@GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listFeed(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "scope", required = false) String scope,
            Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

if (size > 50) size = 50;
        if (size < 1) size = 10;

// TODO: look up universityId for this user from user-service once available
        Long universityId = null;

Page<Post> pageObj = feedService.listFeedForUser(
                username,
                universityId,
                scope,
                PageRequest.of(page, size)
        );

List<Map<String, Object>> items = pageObj.getContent().stream()
                .map(p -> postDto(p, username))
                .toList();

Map<String, Object> resp = new HashMap<>();
        resp.put("items", items);
        resp.put("page", pageObj.getNumber());
        resp.put("size", pageObj.getSize());
        resp.put("totalPages", pageObj.getTotalPages());
        resp.put("totalElements", pageObj.getTotalElements());
        resp.put("hasNext", pageObj.hasNext());

return ResponseEntity.ok(resp);
    }
/* ===== Likes ===== */

@PostMapping("/posts/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> toggleLike(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

Post p = feedService.getPost(id);
        if (p == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Post not found"));
        }

boolean nowLiked = feedService.toggleLike(p, username);
        long likeCount = feedService.countLikes(p);

return ResponseEntity.ok(Map.of(
                "liked", nowLiked,
                "likeCount", likeCount
        ));
    }

/* ===== Comments ===== */

@Data
    public static class CommentRequest {
        @NotBlank
        private String text;
        private String language;
        private Long parentCommentId;
    }

@PostMapping("/posts/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addComment(@PathVariable Long id,
                                        @RequestBody CommentRequest req,
                                        Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

Post p = feedService.getPost(id);
        if (p == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Post not found"));
        }

PostComment c = feedService.addComment(
                p,
                username,
                req.getText(),
                req.getLanguage(),
                req.getParentCommentId()
        );

Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("postId", p.getId());
        m.put("authorUsername", c.getAuthorUsername());
        m.put("text", c.getText());
        m.put("language", c.getLanguage());
        m.put("parentCommentId", c.getParent() != null ? c.getParent().getId() : null);
        m.put("createdAt", c.getCreatedAt());
        m.put("updatedAt", c.getUpdatedAt());

return ResponseEntity.ok(m);
    }

@GetMapping("/posts/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listComments(@PathVariable Long id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

Post p = feedService.getPost(id);
        if (p == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Post not found"));
        }

List<PostComment> comments = feedService.listComments(p);
        List<Map<String, Object>> dto = new ArrayList<>();

for (PostComment c : comments) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("postId", p.getId());
            m.put("authorUsername", c.getAuthorUsername());
            m.put("text", c.getText());
            m.put("language", c.getLanguage());
            m.put("parentCommentId", c.getParent() != null ? c.getParent().getId() : null);
            m.put("createdAt", c.getCreatedAt());
            m.put("updatedAt", c.getUpdatedAt());
            dto.add(m);
        }

return ResponseEntity.ok(dto);
    }

/* ===== Share ===== */

@Data
    public static class ShareRequest {
        private String message;
    }

@PostMapping("/posts/{id}/share")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> share(@PathVariable Long id,
                                   @RequestBody(required = false) ShareRequest req,
                                   Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

Post p = feedService.getPost(id);
        if (p == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Post not found"));
        }

String message = (req != null) ? req.getMessage() : null;
        PostShare share = feedService.sharePost(p, username, message);

Map<String, Object> m = new HashMap<>();
        m.put("id", share.getId());
        m.put("postId", p.getId());
        m.put("sharedByUsername", share.getSharedByUsername());
        m.put("message", share.getMessage());
        m.put("createdAt", share.getCreatedAt());
        m.put("shareCount", feedService.countShares(p));
        return ResponseEntity.ok(m);
    }

/* ===== Translate post text ===== */

@Data
    public static class TranslateRequest {
        @NotBlank
        private String targetLanguage;
    }

@PostMapping("/posts/{id}/translate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> translate(@PathVariable Long id,
                                       @RequestBody TranslateRequest req,
                                       Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

Post p = feedService.getPost(id);
        if (p == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Post not found"));
        }

String translated = feedService.translatePostText(p, req.getTargetLanguage());
        Map<String, Object> m = new HashMap<>();
        m.put("postId", p.getId());
        m.put("originalLanguage", p.getLanguage());
        m.put("targetLanguage", req.getTargetLanguage());
        m.put("translatedText", translated);
        m.put("createdAt", Instant.now());
        return ResponseEntity.ok(m);
    }
}
