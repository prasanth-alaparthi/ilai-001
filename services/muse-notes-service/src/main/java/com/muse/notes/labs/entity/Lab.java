package com.muse.notes.labs.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "labs")
public class Lab {
    public Lab() {
    }

    public Lab(Long id, String title, String description, LabCategory category, String subject, String difficulty,
            String content, String imageUrl, Quiz quiz) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.subject = subject;
        this.difficulty = difficulty;
        this.content = content;
        this.imageUrl = imageUrl;
        this.quiz = quiz;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private LabCategory category;

    private String subject;
    private String difficulty;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;

    @OneToOne(mappedBy = "lab", cascade = CascadeType.ALL)
    private Quiz quiz;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LabCategory getCategory() {
        return category;
    }

    public void setCategory(LabCategory category) {
        this.category = category;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }
}
