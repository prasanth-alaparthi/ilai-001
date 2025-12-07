package com.muse.notes.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.Instant;

@Data
public class NoteDto {
    private Long id;
    private String title;
    private JsonNode content;
    private Long authorId;
    private String authorName;
    private String excerpt;
    private Instant createdAt;
    private Instant updatedAt;
}
