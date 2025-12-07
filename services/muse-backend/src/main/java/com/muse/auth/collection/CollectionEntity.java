package com.muse.auth.collection;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "collections")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="owner_user_id", nullable=false)
    private Long ownerUserId;

    private String name;

    @Column(name="description", columnDefinition = "text")
    private String description;

    @Column(name="item_count")
    @Builder.Default
    private Integer itemCount = 0;

    private Instant createdAt;
    private Instant updatedAt;
}