package com.muse.social.bounty.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class SubmitAttemptRequest {

    private Long solutionNoteId;

    @Size(max = 5000, message = "Explanation must be less than 5000 characters")
    private String explanation;
}
