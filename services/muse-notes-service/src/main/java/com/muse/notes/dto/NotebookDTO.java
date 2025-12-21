package com.muse.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * NotebookDTO - Data Transfer Object for Notebook entity.
 * Used for inter-service communication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotebookDTO {

    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String color;
    private Integer sectionCount;
    private Integer noteCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Optional metadata
    private Boolean isFavorite;
    private Boolean isArchived;
}
