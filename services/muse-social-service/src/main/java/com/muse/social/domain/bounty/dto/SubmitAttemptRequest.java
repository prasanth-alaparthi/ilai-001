package com.muse.social.domain.bounty.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class SubmitAttemptRequest {

    private Long solutionNoteId;

    @Size(max = 5000)
    private String explanation;
}
