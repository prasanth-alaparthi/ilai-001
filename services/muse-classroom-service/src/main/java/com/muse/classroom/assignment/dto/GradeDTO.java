package com.muse.classroom.assignment.dto;

import com.muse.classroom.assignment.entity.Grade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeDTO {
    private Long id;
    private Long submissionId;
    private Integer score;
    private String feedback;
    private Grade.GraderType graderType;
    private Instant gradedDate;
}
