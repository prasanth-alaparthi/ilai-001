package com.muse.feed.dto;

import com.muse.feed.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private Long userId;
    private String authorUsername;
    private String authorAvatarUrl;
    private String content;
    private List<String> tags;
    private List<String> mediaUrls;
    private Post.MediaType mediaType;
    private Instant createdAt;
    private Instant updatedAt;
    private int likeCount;
    private int commentCount;
    private boolean likedByMe;
}
