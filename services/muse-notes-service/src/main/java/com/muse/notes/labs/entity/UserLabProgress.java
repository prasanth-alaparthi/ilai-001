package com.muse.notes.labs.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_lab_progress")
public class UserLabProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;

    @ManyToOne
    @JoinColumn(name = "lab_id")
    private Lab lab;

    private boolean isCompleted;
    private Integer quizScore;

    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    private Long runtimeMinutes = 0L;

    private Instant lastAccessedAt;

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        this.lastAccessedAt = Instant.now();
    }

    public UserLabProgress() {
    }

    public UserLabProgress(Long id, String userId, Lab lab, boolean isCompleted, Integer quizScore,
            Instant lastAccessedAt) {
        this.id = id;
        this.userId = userId;
        this.lab = lab;
        this.isCompleted = isCompleted;
        this.quizScore = quizScore;
        this.lastAccessedAt = lastAccessedAt;
    }

    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Lab getLab() {
        return lab;
    }

    public void setLab(Lab lab) {
        this.lab = lab;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

    public void setCompleted(boolean completed) {
        isCompleted = completed;
    }

    public Integer getQuizScore() {
        return quizScore;
    }

    public void setQuizScore(Integer quizScore) {
        this.quizScore = quizScore;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
    }

    public Long getRuntimeMinutes() {
        return runtimeMinutes;
    }

    public void setRuntimeMinutes(Long runtimeMinutes) {
        this.runtimeMinutes = runtimeMinutes;
    }

    public Instant getLastAccessedAt() {
        return lastAccessedAt;
    }
}
