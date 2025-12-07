package com.muse.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NotebookDto {
    private Long id; // For updates
    @NotBlank
    @Size(max = 255)
    private String name;
    @Size(max = 1024)
    private String description;
}
