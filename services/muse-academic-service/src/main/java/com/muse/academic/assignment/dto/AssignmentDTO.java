package com.muse.academic.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDTO {
    private Long id;
    private String title;
    private String description;
    private String criteria;
    private Instant dueDate;
    private Integer maxScore;
    private Long courseId;
    private String teacherId;
    private Instant createdAt;
}
