package com.muse.social.domain.bounty.dto;

import com.muse.social.domain.bounty.entity.Bounty;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BountyResponse {
    private Long id;
    private Long creatorId;
    private Long linkedNoteId;
    private String title;
    private String description;
    private String subject;
    private String difficulty;
    private Integer rewardPoints;
    private String status;
    private Long solverId;
    private Long solutionNoteId;
    private LocalDateTime deadline;
    private Integer viewCount;
    private Integer attemptCount;
    private String tags;
    private LocalDateTime createdAt;
    private LocalDateTime solvedAt;

    public static BountyResponse fromEntity(Bounty bounty) {
        return BountyResponse.builder()
                .id(bounty.getId())
                .creatorId(bounty.getCreatorId())
                .linkedNoteId(bounty.getLinkedNoteId())
                .title(bounty.getTitle())
                .description(bounty.getDescription())
                .subject(bounty.getSubject())
                .difficulty(bounty.getDifficulty())
                .rewardPoints(bounty.getRewardPoints())
                .status(bounty.getStatus())
                .solverId(bounty.getSolverId())
                .solutionNoteId(bounty.getSolutionNoteId())
                .deadline(bounty.getDeadline())
                .viewCount(bounty.getViewCount())
                .attemptCount(bounty.getAttemptCount())
                .tags(bounty.getTags())
                .createdAt(bounty.getCreatedAt())
                .solvedAt(bounty.getSolvedAt())
                .build();
    }
}
