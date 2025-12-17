package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Dynamic Subject Categories for Study Search
 * Stored in database - can be added/edited/disabled without code changes
 */
@Entity
@Table(name = "subject_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectCategory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String code;  // "cs", "math", "physics"
    
    @Column(nullable = false, length = 100)
    private String name;  // "Computer Science"
    
    @Column(length = 10)
    private String iconEmoji;  // "💻"
    
    @Column(length = 20)
    private String color;  // "#3B82F6"
    
    @Column(length = 500)
    private String description;  // Brief description
    
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    @Builder.Default
    private Boolean enabled = true;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
