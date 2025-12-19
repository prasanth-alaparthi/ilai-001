package com.muse.notes.journal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "teacher_course_mappings", indexes = {
        @Index(name = "idx_teacher_course", columnList = "teacher_username, course_code")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCourseMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_username", nullable = false)
    private String teacherUsername;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    @Column(name = "assigned_at")
    private Instant assignedAt;
}
