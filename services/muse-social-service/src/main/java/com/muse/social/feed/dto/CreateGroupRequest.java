package com.muse.social.feed.dto;

import com.muse.social.feed.entity.StudyGroup;
import lombok.Data;

import java.util.List;

/**
 * Request to create a study group
 */
@Data
public class CreateGroupRequest {
    private String name;
    private String description;
    private String coverImageUrl;
    private StudyGroup.GroupType groupType;
    private StudyGroup.GroupVisibility visibility;
    private StudyGroup.ApprovalType joinApproval;
    private List<String> hashtags;
    private List<String> subjects;
    private String educationLevel;
}
