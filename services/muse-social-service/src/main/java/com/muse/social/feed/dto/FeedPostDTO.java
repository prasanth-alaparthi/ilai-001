package com.muse.social.feed.dto;

import com.muse.social.feed.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for feed post responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedPostDTO {
    private Long id;
    private Long userId;
    private String authorName;
    private String authorAvatar;
    private String authorCredentials;
    private String content;
    private List<String> hashtags;
    private List<String> mediaUrls;
    private Post.MediaType mediaType;
    private Post.ContentType contentType;
    private Post.DifficultyLevel difficultyLevel;
    private Post.Visibility visibility;
    private UUID groupId;
    private String groupName;

    // Engagement
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Integer saveCount;
    private Integer shareCount;

    // User-specific state
    private Boolean isLiked;
    private Boolean isSaved;
    private Boolean isFollowingAuthor;

    private Instant createdAt;
    private String timeAgo;

    public static FeedPostDTO fromEntity(Post post) {
        return FeedPostDTO.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(post.getAuthorName())
                .authorAvatar(post.getAuthorAvatar())
                .authorCredentials(post.getAuthorCredentials())
                .content(post.getContent())
                .hashtags(post.getHashtags())
                .mediaUrls(post.getMediaUrls())
                .mediaType(post.getMediaType())
                .contentType(post.getContentType())
                .difficultyLevel(post.getDifficultyLevel())
                .visibility(post.getVisibility())
                .groupId(post.getGroupId())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .saveCount(post.getSaveCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
