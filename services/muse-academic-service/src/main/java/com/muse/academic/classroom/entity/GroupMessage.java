package com.muse.academic.classroom.entity;

import jakarta.persistence.*;
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getClubId() {
        return clubId;
    }

    public void setClubId(Long clubId) {
        this.clubId = clubId;
    }

    public Long getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Long classroomId) {
        this.classroomId = classroomId;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }
}
