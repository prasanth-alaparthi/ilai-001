package com.muse.social.feed.dto;

import com.muse.social.feed.entity.Post;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request to create a new post
 */
@Data
public class CreatePostRequest {
    private String content;
    private List<String> hashtags;
    private List<String> mediaUrls;
    private Post.MediaType mediaType;
    private Post.ContentType contentType;
    private Post.DifficultyLevel difficultyLevel;
    private Post.Visibility visibility;
    private UUID groupId; // If posting to a group
}
