package com.muse.journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JournalEntryCreateRequest {

    @Size(max = 200)
    private String title;

    @NotBlank(message = "contentJson is required")
    private String contentJson;

    @Size(max = 64)
    private String courseCode;

    // optional: contentHtml, you can generate later if needed
    private String contentHtml;
}
