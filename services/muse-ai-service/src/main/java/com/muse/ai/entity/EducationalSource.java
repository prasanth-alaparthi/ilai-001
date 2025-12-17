package com.muse.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Dynamic Educational Source Configuration for Study Search
 * Sources can be added/edited/disabled without code changes
 * Supports any REST API with configurable response mapping
 */
@Entity
@Table(name = "educational_sources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationalSource {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String code;  // "core", "semantic_scholar", "arxiv"
    
    @Column(nullable = false, length = 100)
    private String name;  // "CORE API", "Semantic Scholar"
    
    @Column(nullable = false, length = 50)
    private String category;  // "academic", "books", "general", "medical"
    
    @Column(length = 10)
    private String iconEmoji;  // "📚"
    
    @Column(length = 20)
    private String color;  // "#4F46E5"
    
    @Column(length = 500)
    private String description;
    
    // === API Configuration ===
    
    @Column(name = "base_url", nullable = false, length = 500)
    private String baseUrl;  // "https://api.core.ac.uk/v3"
    
    @Column(name = "search_endpoint", nullable = false, length = 500)
    private String searchEndpoint;  // "/search/works?q={query}&limit={limit}"
    
    @Column(name = "http_method", length = 10)
    @Builder.Default
    private String httpMethod = "GET";
    
    @Column(name = "api_key_header", length = 100)
    private String apiKeyHeader;  // "Authorization" or "X-API-Key"
    
    @Column(name = "api_key", length = 500)
    private String apiKey;  // Encrypted API key (if needed)
    
    @Column(name = "request_headers", columnDefinition = "TEXT")
    private String requestHeaders;  // JSON: {"Accept": "application/json"}
    
    // === Response Mapping (JSON Path expressions) ===
    
    @Column(name = "results_path", length = 200)
    private String resultsPath;  // "$.results" or "$.data.works"
    
    @Column(name = "title_path", length = 200)
    private String titlePath;  // "$.title"
    
    @Column(name = "snippet_path", length = 200)
    private String snippetPath;  // "$.abstract" or "$.description"
    
    @Column(name = "url_path", length = 200)
    private String urlPath;  // "$.links[0].url"
    
    @Column(name = "authors_path", length = 200)
    private String authorsPath;  // "$.authors[*].name"
    
    @Column(name = "published_date_path", length = 200)
    private String publishedDatePath;  // "$.publishedDate"
    
    @Column(name = "thumbnail_path", length = 200)
    private String thumbnailPath;  // "$.thumbnail.url"
    
    // === Subject Mapping ===
    
    @Column(length = 500)
    private String subjects;  // Comma-separated: "cs,math,physics" or "all"
    
    // === Display & Behavior ===
    
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    @Builder.Default
    private Boolean enabled = true;
    
    @Column(name = "is_premium")
    @Builder.Default
    private Boolean isPremium = false;  // Requires premium subscription
    
    @Column(name = "rate_limit_per_minute")
    @Builder.Default
    private Integer rateLimitPerMinute = 60;
    
    @Column(name = "cache_ttl_hours")
    @Builder.Default
    private Integer cacheTtlHours = 24;
    
    // === Timestamps ===
    
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
    
    /**
     * Check if this source applies to a given subject
     */
    public boolean appliesTo(String subject) {
        if (subjects == null || subjects.isBlank() || subjects.equalsIgnoreCase("all")) {
            return true;
        }
        return subjects.toLowerCase().contains(subject.toLowerCase());
    }
}
