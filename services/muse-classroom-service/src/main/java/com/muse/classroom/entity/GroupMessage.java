package com.muse.classroom.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "group_messages")
public class GroupMessage {
    public GroupMessage() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderId; // User ID
    private String senderName;

    @Column(columnDefinition = "TEXT")
    private String content;

    // Can belong to a Club OR a Classroom
    private Long clubId;
    private Long classroomId;

    private Instant sentAt;

    @PrePersist
    void onCreate() {
        this.sentAt = Instant.now();
    }

    public Long getClubId() {
        return clubId;
    }

    public void setClubId(Long clubId) {
        this.clubId = clubId;
    }
}
