package com.muse.ai.controller;

import com.muse.ai.service.FreeSearchService;
import com.muse.ai.service.FreeSearchService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Free Search Controller - Search without AI costs
 * Provides unified search for FREE mode users
 */
@RestController
@RequestMapping("/api/search/free")
@RequiredArgsConstructor
public class FreeSearchController {
    
    private final FreeSearchService searchService;
    
    /**
     * Unified free search across notes, feed, etc.
     */
    @GetMapping
    public ResponseEntity<FreeSearchResults> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "true") boolean notes,
            @RequestParam(defaultValue = "true") boolean feed,
            @AuthenticationPrincipal Jwt jwt) {
        
        Long userId = extractUserId(jwt);
        SearchOptions options = new SearchOptions(notes, feed, limit);
        
        FreeSearchResults results = searchService.search(q, userId, options);
        return ResponseEntity.ok(results);
    }
    
    /**
     * Quick search (notes only, faster)
     */
    @GetMapping("/quick")
    public ResponseEntity<FreeSearchResults> quickSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal Jwt jwt) {
        
        Long userId = extractUserId(jwt);
        SearchOptions options = new SearchOptions(true, false, limit);
        
        FreeSearchResults results = searchService.search(q, userId, options);
        return ResponseEntity.ok(results);
    }
    
    private Long extractUserId(Jwt jwt) {
        if (jwt == null) return 1L;
        Object userId = jwt.getClaim("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return Long.parseLong(jwt.getSubject());
    }
}
