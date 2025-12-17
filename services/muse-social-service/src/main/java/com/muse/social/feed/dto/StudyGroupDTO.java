package com.muse.social.feed.dto;

import com.muse.social.feed.entity.StudyGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for study group responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyGroupDTO {
    private UUID id;
    private String name;
    private String description;
    private String coverImageUrl;
    private List<String> hashtags;
    private List<String> subjects;
    private StudyGroup.GroupVisibility visibility;
    private StudyGroup.GroupType groupType;
    private String educationLevel;
    private Integer memberCount;
    private Integer postCount;
    private String createdBy;
    private Instant createdAt;

    // User state
    private Boolean isMember;
    private Boolean isAdmin;

    public static StudyGroupDTO fromEntity(StudyGroup group) {
        return StudyGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .coverImageUrl(group.getCoverImageUrl())
                .hashtags(group.getHashtags())
                .subjects(group.getSubjects())
                .visibility(group.getVisibility())
                .groupType(group.getGroupType())
                .educationLevel(group.getEducationLevel())
                .memberCount(group.getMemberCount())
                .postCount(group.getPostCount())
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .build();
    }
}
