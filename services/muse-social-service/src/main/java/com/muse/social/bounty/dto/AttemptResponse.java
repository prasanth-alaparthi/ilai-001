package com.muse.social.bounty.dto;

import com.muse.social.bounty.entity.BountyAttempt;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AttemptResponse {
    private Long id;
    private Long bountyId;
    private Long userId;
    private Long solutionNoteId;
    private String explanation;
    private String status;
    private Long reviewerId;
    private String reviewComment;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    public static AttemptResponse fromEntity(BountyAttempt attempt) {
        return AttemptResponse.builder()
                .id(attempt.getId())
                .bountyId(attempt.getBountyId())
                .userId(attempt.getUserId())
                .solutionNoteId(attempt.getSolutionNoteId())
                .explanation(attempt.getExplanation())
                .status(attempt.getStatus())
                .reviewerId(attempt.getReviewerId())
                .reviewComment(attempt.getReviewComment())
                .createdAt(attempt.getCreatedAt())
                .reviewedAt(attempt.getReviewedAt())
                .build();
    }
}
