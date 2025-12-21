package com.muse.social.bounty.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
public class CreateBountyRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    @Size(max = 5000, message = "Description must be less than 5000 characters")
    private String description;

    private Long linkedNoteId;

    private String subject; // math | physics | chemistry | cs | general

    private String difficulty; // easy | medium | hard | expert

    @Min(value = 5, message = "Minimum reward is 5 points")
    @Max(value = 500, message = "Maximum reward is 500 points")
    private Integer rewardPoints;

    private LocalDateTime deadline;

    private String tags; // Comma-separated

    private boolean aiGenerated; // Track if AI helped generate this
}
