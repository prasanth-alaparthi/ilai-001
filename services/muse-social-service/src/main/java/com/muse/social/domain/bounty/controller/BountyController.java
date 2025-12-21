package com.muse.social.domain.bounty.controller;

import com.muse.social.domain.bounty.dto.*;
import com.muse.social.domain.bounty.entity.Bounty;
import com.muse.social.domain.bounty.entity.BountyAttempt;
import com.muse.social.domain.bounty.service.BountyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * BountyBoard REST Controller - DDD Implementation
 */
@RestController
@RequestMapping("/api/bounties")
@RequiredArgsConstructor
@Slf4j
public class BountyController {

    private final BountyService bountyService;

    @PostMapping
    public ResponseEntity<BountyResponse> createBounty(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateBountyRequest request) {
        Long userId = Long.parseLong(jwt.getSubject());
        Bounty bounty = bountyService.createBounty(userId, request);
        return ResponseEntity.ok(BountyResponse.fromEntity(bounty));
    }

    @GetMapping
    public ResponseEntity<Page<BountyResponse>> getBounties(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Bounty> bounties;
        if (search != null && !search.isBlank()) {
            bounties = bountyService.searchBounties(search, pageable);
        } else if (subject != null && !subject.isBlank()) {
            bounties = bountyService.getBountiesBySubject(subject, pageable);
        } else {
            bounties = bountyService.getOpenBounties(pageable);
        }
        return ResponseEntity.ok(bounties.map(BountyResponse::fromEntity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BountyResponse> getBounty(@PathVariable Long id) {
        Bounty bounty = bountyService.getBounty(id);
        return ResponseEntity.ok(BountyResponse.fromEntity(bounty));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<AttemptResponse> submitAttempt(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody SubmitAttemptRequest request) {
        Long userId = Long.parseLong(jwt.getSubject());
        BountyAttempt attempt = bountyService.submitAttempt(userId, id, request);
        return ResponseEntity.ok(AttemptResponse.fromEntity(attempt));
    }

    @PostMapping("/{bountyId}/attempts/{attemptId}/accept")
    public ResponseEntity<BountyResponse> acceptSolution(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long bountyId,
            @PathVariable Long attemptId) {
        Long userId = Long.parseLong(jwt.getSubject());
        Bounty bounty = bountyService.acceptSolution(userId, bountyId, attemptId);
        return ResponseEntity.ok(BountyResponse.fromEntity(bounty));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BountyResponse> cancelBounty(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        Long userId = Long.parseLong(jwt.getSubject());
        Bounty bounty = bountyService.cancelBounty(userId, id);
        return ResponseEntity.ok(BountyResponse.fromEntity(bounty));
    }

    @GetMapping("/mine/created")
    public ResponseEntity<?> getMyCreatedBounties(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(bountyService.getCreatedBounties(userId).stream()
                .map(BountyResponse::fromEntity).toList());
    }

    @GetMapping("/mine/solved")
    public ResponseEntity<?> getMySolvedBounties(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return ResponseEntity.ok(bountyService.getSolvedBounties(userId).stream()
                .map(BountyResponse::fromEntity).toList());
    }
}
