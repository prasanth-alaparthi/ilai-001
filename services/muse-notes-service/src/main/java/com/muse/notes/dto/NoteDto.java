package com.muse.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * NoteDTO - Data Transfer Object for Note entity.
 * Used for inter-service communication with Social Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteDTO {

    private Long id;
    private Long userId;
    private Long sectionId;
    private String title;
    private Object content; // JSON content
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastModified;

    // Optional metadata
    private Long notebookId;
    private String notebookName;
    private String sectionName;
    private Boolean isShared;
    private Boolean isFavorite;
    private String[] tags;
}
