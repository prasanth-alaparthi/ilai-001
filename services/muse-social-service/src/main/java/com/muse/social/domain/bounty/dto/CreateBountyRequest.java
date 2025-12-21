package com.muse.social.domain.bounty.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateBountyRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    private Long linkedNoteId;

    private String subject; // math | physics | chemistry | cs | general

    private String difficulty; // easy | medium | hard | expert

    @Min(5)
    @Max(1000)
    private Integer rewardPoints;

    private LocalDateTime deadline;

    private String tags;
}
