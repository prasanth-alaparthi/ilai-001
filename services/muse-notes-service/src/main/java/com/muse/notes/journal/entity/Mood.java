package com.muse.notes.journal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "moods", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "entry_date"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mood {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(nullable = false)
    private String moodType; // e.g., "HAPPY", "SAD", "PRODUCTIVE", "ANXIOUS"

    private String notes;
}
