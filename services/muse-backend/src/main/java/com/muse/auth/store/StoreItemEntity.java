package com.muse.auth.store;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "store_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Long price; // cents or smallest currency unit
    private String thumbnail;
    private String metaJson;

    private Instant createdAt;
    private Instant updatedAt;
}


