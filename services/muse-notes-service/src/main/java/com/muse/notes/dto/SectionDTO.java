package com.muse.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * SectionDTO - Data Transfer Object for Section (Chapter) entity.
 * Used for inter-service communication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionDTO {

    private Long id;
    private Long notebookId;
    private String name;
    private String description;
    private Integer position;
    private Integer noteCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Optional metadata
    private String notebookName;
    private String color;
}
