package com.muse.social.warroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "room_variables")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomVariable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private String value;

    private String unit;

    @Column(name = "precision_digits")
    private Integer precisionDigits;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "vector_clock")
    private Map<String, Long> vectorClock;

    @Column(name = "last_updated_by")
    private Long lastUpdatedBy;

    private String source;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isVerified == null)
            isVerified = false;
        if (precisionDigits == null)
            precisionDigits = 6;
        if (source == null)
            source = "user";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
