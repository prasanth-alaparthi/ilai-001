package com.muse.auth.feed.entity;
import com.muse.auth.feed.MediaType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feed_post_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MediaType type;

    @Column(nullable = false, length = 512)
    private String url; // served via /uploads/**

    @Column(length = 128)
    private String mimeType;

    private Long sizeBytes;

    private Integer width;
    private Integer height;

    private Double durationSeconds;
}
