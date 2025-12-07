package com.muse.notes.journal.dto;

import com.muse.notes.journal.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewDecisionRequest {
    @NotNull
    private ReviewStatus status;
    private String comments;
}
