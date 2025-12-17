package com.muse.ai.controller;

import com.muse.ai.entity.EducationalSource;
import com.muse.ai.entity.SubjectCategory;
import com.muse.ai.repository.EducationalSourceRepository;
import com.muse.ai.repository.SubjectCategoryRepository;
import com.muse.ai.service.StudySearchService;
import com.muse.ai.service.StudySearchService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Study Search Controller - REST API for unified educational search
 */
@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StudySearchController {

    private final StudySearchService searchService;
    private final EducationalSourceRepository sourceRepository;
    private final SubjectCategoryRepository categoryRepository;

    // ============== Search Endpoints ==============

    /**
     * Main search endpoint
     * GET
     * /api/study/search?q=machine+learning&sources=arxiv,core&subjects=cs&local=true
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<StudySearchResponse>> search(
            @RequestParam String q,
            @RequestParam(required = false) List<String> sources,
            @RequestParam(required = false) List<String> subjects,
            @RequestParam(defaultValue = "true") boolean local,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = extractUserId(jwt);
        boolean isPremium = checkPremium(jwt);

        StudySearchRequest request = new StudySearchRequest(
                q, sources, subjects, local, isPremium, userId, limit);

        return searchService.search(request)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> {
                    log.error("Search failed: {}", e.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    // ============== Sources Endpoints ==============

    /**
     * Get all enabled sources for UI filters
     */
    @GetMapping("/sources")
    public ResponseEntity<List<SourceInfo>> getSources() {
        return ResponseEntity.ok(searchService.getEnabledSources());
    }

    /**
     * Get all sources (admin)
     */
    @GetMapping("/sources/all")
    public ResponseEntity<List<EducationalSource>> getAllSources() {
        return ResponseEntity.ok(sourceRepository.findAll());
    }

    /**
     * Add new source (admin)
     */
    @PostMapping("/sources")
    public ResponseEntity<?> addSource(@RequestBody EducationalSource source) {
        if (sourceRepository.existsByCode(source.getCode())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Source with code '" + source.getCode() + "' already exists"));
        }
        EducationalSource saved = sourceRepository.save(source);
        return ResponseEntity.ok(saved);
    }

    /**
     * Update source (admin)
     */
    @PutMapping("/sources/{id}")
    public ResponseEntity<?> updateSource(@PathVariable Long id, @RequestBody EducationalSource source) {
        return sourceRepository.findById(id)
                .map(existing -> {
                    source.setId(id);
                    return ResponseEntity.ok(sourceRepository.save(source));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Toggle source enabled status (admin)
     */
    @PatchMapping("/sources/{id}/toggle")
    public ResponseEntity<?> toggleSource(@PathVariable Long id) {
        return sourceRepository.findById(id)
                .map(source -> {
                    source.setEnabled(!source.getEnabled());
                    return ResponseEntity.ok(sourceRepository.save(source));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete source (admin)
     */
    @DeleteMapping("/sources/{id}")
    public ResponseEntity<?> deleteSource(@PathVariable Long id) {
        if (sourceRepository.existsById(id)) {
            sourceRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("deleted", id));
        }
        return ResponseEntity.notFound().build();
    }

    // ============== Categories Endpoints ==============

    /**
     * Get all enabled categories for UI filters
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryInfo>> getCategories() {
        return ResponseEntity.ok(searchService.getEnabledCategories());
    }

    /**
     * Get all categories (admin)
     */
    @GetMapping("/categories/all")
    public ResponseEntity<List<SubjectCategory>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    /**
     * Add new category (admin)
     */
    @PostMapping("/categories")
    public ResponseEntity<?> addCategory(@RequestBody SubjectCategory category) {
        if (categoryRepository.existsByCode(category.getCode())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Category with code '" + category.getCode() + "' already exists"));
        }
        SubjectCategory saved = categoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }

    /**
     * Update category (admin)
     */
    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody SubjectCategory category) {
        return categoryRepository.findById(id)
                .map(existing -> {
                    category.setId(id);
                    return ResponseEntity.ok(categoryRepository.save(category));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Toggle category enabled status (admin)
     */
    @PatchMapping("/categories/{id}/toggle")
    public ResponseEntity<?> toggleCategory(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(cat -> {
                    cat.setEnabled(!cat.getEnabled());
                    return ResponseEntity.ok(categoryRepository.save(cat));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ============== Helpers ==============

    private Long extractUserId(Jwt jwt) {
        if (jwt == null)
            return null;
        Object userId = jwt.getClaim("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    private boolean checkPremium(Jwt jwt) {
        if (jwt == null)
            return false;
        Object premium = jwt.getClaim("premium");
        return Boolean.TRUE.equals(premium);
    }
}
