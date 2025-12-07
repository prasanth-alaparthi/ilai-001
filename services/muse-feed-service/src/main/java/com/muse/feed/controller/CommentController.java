package com.muse.feed.controller;

import com.muse.feed.service.CommentService;
import com.muse.feed.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feed/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<?> getComments(@RequestParam Long postId) {
        return ResponseEntity.ok(commentService.getCommentsForPost(postId));
    }

    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody Map<String, Object> payload, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        Long postId = Long.valueOf(payload.get("postId").toString());
        String content = (String) payload.get("content");
        return ResponseEntity.of(commentService.createComment(postId, userId, content));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        if (commentService.deleteComment(commentId, userId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
