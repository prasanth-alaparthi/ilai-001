package com.muse.journal.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JournalEntryUpdateRequest {

    @Size(max = 200)
    private String title;

    private String contentJson;

    private String contentHtml;

    @Size(max = 64)
    private String courseCode;
}
