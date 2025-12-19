package com.muse.notes.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoteLinkDto {
    private Long sourceNoteId;
    private String sourceNoteTitle;
    private Long targetNoteId;
    private String targetNoteTitle;
    private Float relevanceScore;
    private boolean manual; // Relevance score 1.0 = manual
}
