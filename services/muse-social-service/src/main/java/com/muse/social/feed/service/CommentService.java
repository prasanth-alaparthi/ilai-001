package com.muse.social.feed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.social.feed.entity.Comment;
import com.muse.social.feed.repository.CommentRepository;
import com.muse.social.feed.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final FeedWebSocketHandler feedWebSocketHandler; // Inject WebSocket handler
    private final ObjectMapper objectMapper; // Inject ObjectMapper

    public List<Comment> getCommentsForPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    public Optional<Comment> createComment(Long postId, Long userId, String content) {
        return postRepository.findById(postId)
                .map(post -> {
                    Comment comment = Comment.builder()
                            .post(post)
                            .userId(userId)
                            .content(content)
                            .build();
                    Comment savedComment = commentRepository.save(comment);
                    // Broadcast new comment
                    try {
                        feedWebSocketHandler.broadcastToAll(objectMapper.writeValueAsString(Map.of("type", "new_comment", "comment", savedComment)));
                    } catch (IOException e) {
                        // Log error
                    }
                    return savedComment;
                });
    }

    public boolean deleteComment(Long commentId, Long userId) {
        return commentRepository.findById(commentId)
                .filter(comment -> comment.getUserId().equals(userId))
                .map(comment -> {
                    commentRepository.delete(comment);
                    // Broadcast deleted comment
                    try {
                        feedWebSocketHandler.broadcastToAll(objectMapper.writeValueAsString(Map.of("type", "delete_comment", "commentId", commentId)));
                    } catch (IOException e) {
                        // Log error
                    }
                    return true;
                })
                .orElse(false);
    }
}
