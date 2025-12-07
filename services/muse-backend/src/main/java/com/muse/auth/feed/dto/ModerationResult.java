package com.muse.auth.feed.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModerationResult {
    private boolean studyRelated;
    private boolean ageAppropriate;
    private String subjectTag;       // e.g. "math", "history"
    private String reason;           // short reason for logs
    private boolean requiresReview;  // true => mark PENDING_REVIEW
}
