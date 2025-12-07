package com.muse.calendar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "calendar_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private Instant startTime;

    @Column
    private Instant endTime;

    private boolean allDay;

    private String location;

    @Column(nullable = false)
    private String type; // PERSONAL, ACADEMIC, EXAM, HOLIDAY, ASSIGNMENT, PROJECT, TODO, STREAK

    @Column(nullable = false)
    private String userId;

    private String recurrenceRule; // RRULE string for recurring events

    // New fields for integration
    private String status; // PENDING, COMPLETED, IN_PROGRESS
    private String groupId; // For team/group calendars
    private Long sourceId; // ID from external service (assignmentId, projectId)
    private String sourceType; // ACADEMIC_SERVICE, etc.
    private Integer streakCount; // For streak reminders

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
