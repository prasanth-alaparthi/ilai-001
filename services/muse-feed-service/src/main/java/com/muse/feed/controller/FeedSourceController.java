package com.muse.feed.controller;

import com.muse.feed.entity.RssFeedSource;
import com.muse.feed.repository.RssFeedSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feed/sources")
@RequiredArgsConstructor
public class FeedSourceController {

    private final RssFeedSourceRepository rssFeedSourceRepository;

    @GetMapping
    public ResponseEntity<List<RssFeedSource>> getAllSources() {
        List<RssFeedSource> sources = rssFeedSourceRepository.findAll();
        return ResponseEntity.ok(sources);
    }

    @GetMapping("/active")
    public ResponseEntity<List<RssFeedSource>> getActiveSources() {
        List<RssFeedSource> sources = rssFeedSourceRepository.findByActiveTrueOrderByPriorityDesc();
        return ResponseEntity.ok(sources);
    }

    @GetMapping("/by-category")
    public ResponseEntity<Map<String, List<RssFeedSource>>> getSourcesByCategory() {
        List<RssFeedSource> allSources = rssFeedSourceRepository.findAll();
        Map<String, List<RssFeedSource>> byCategory = allSources.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        source -> source.getCategory() != null ? source.getCategory() : "Other"));
        return ResponseEntity.ok(byCategory);
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<RssFeedSource> toggleSource(@PathVariable Long id) {
        return rssFeedSourceRepository.findById(id)
                .map(source -> {
                    source.setActive(!source.isActive());
                    RssFeedSource updated = rssFeedSourceRepository.save(source);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<RssFeedSource> updateSource(@PathVariable Long id, @RequestBody RssFeedSource updatedSource) {
        return rssFeedSourceRepository.findById(id)
                .map(source -> {
                    if (updatedSource.getName() != null)
                        source.setName(updatedSource.getName());
                    if (updatedSource.getCategory() != null)
                        source.setCategory(updatedSource.getCategory());
                    if (updatedSource.getPriority() != 0)
                        source.setPriority(updatedSource.getPriority());
                    source.setActive(updatedSource.isActive());
                    RssFeedSource saved = rssFeedSourceRepository.save(source);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RssFeedSource> createSource(@RequestBody RssFeedSource newSource) {
        RssFeedSource created = rssFeedSourceRepository.save(newSource);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSource(@PathVariable Long id) {
        rssFeedSourceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
