package com.muse.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long targetId; // Can be a post or a comment

    @Column(nullable = false)
    private String targetType; // "POST" or "COMMENT"

    @Column(nullable = false)
    private String reactionType; // e.g., "LIKE", "HEART", "CELEBRATE"
}
