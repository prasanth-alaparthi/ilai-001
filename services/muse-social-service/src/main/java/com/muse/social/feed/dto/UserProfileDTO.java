package com.muse.social.feed.dto;

import com.muse.social.feed.entity.FeedUserProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for user profile responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private String userId;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String coverImageUrl;
    private String credentials;
    private String institution;
    private String educationLevel;
    private Integer graduationYear;
    private List<String> subjects;
    private Integer followerCount;
    private Integer followingCount;
    private Integer friendCount;
    private Integer postCount;
    private Boolean isVerified;
    private Boolean isPrivate;

    // User state
    private Boolean isFollowing;
    private Boolean isFriend;

    public static UserProfileDTO fromEntity(FeedUserProfile profile) {
        return UserProfileDTO.builder()
                .userId(profile.getUserId())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .coverImageUrl(profile.getCoverImageUrl())
                .credentials(profile.getCredentials())
                .institution(profile.getInstitution())
                .educationLevel(profile.getEducationLevel())
                .graduationYear(profile.getGraduationYear())
                .subjects(profile.getSubjects())
                .followerCount(profile.getFollowerCount())
                .followingCount(profile.getFollowingCount())
                .friendCount(profile.getFriendCount())
                .postCount(profile.getPostCount())
                .isVerified(profile.getIsVerified())
                .isPrivate(profile.getIsPrivate())
                .build();
    }
}
