package com.muse.social.feed.controller;

import com.muse.social.feed.service.ReactionService;
import com.muse.social.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feed/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @GetMapping
    public ResponseEntity<?> getReactions(@RequestParam Long targetId, @RequestParam String targetType) {
        return ResponseEntity.ok(reactionService.getReactions(targetId, targetType));
    }

    @PostMapping
    public ResponseEntity<?> addReaction(@RequestBody Map<String, Object> payload, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        Long targetId = Long.valueOf(payload.get("targetId").toString());
        String targetType = (String) payload.get("targetType");
        String reactionType = (String) payload.get("reactionType");
        return ResponseEntity.ok(reactionService.addReaction(userId, targetId, targetType, reactionType));
    }

    @DeleteMapping("/{reactionId}")
    public ResponseEntity<?> removeReaction(@PathVariable Long reactionId, Authentication auth) {
        Long userId = AuthUtils.getUserIdFromAuthentication(auth);
        reactionService.removeReaction(reactionId, userId);
        return ResponseEntity.noContent().build();
    }
}
