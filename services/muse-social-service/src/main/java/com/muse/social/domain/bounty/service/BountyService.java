package com.muse.social.domain.bounty.service;

import com.muse.social.domain.bounty.dto.*;
import com.muse.social.domain.bounty.entity.Bounty;
import com.muse.social.domain.bounty.entity.BountyAttempt;
import com.muse.social.domain.bounty.repository.BountyRepository;
import com.muse.social.domain.bounty.repository.BountyAttemptRepository;
import com.muse.social.reputation.service.ReputationService;
import com.muse.social.application.orchestrator.NoteShareOrchestrator;
import com.muse.social.application.orchestrator.BountySolveOrchestrator;
import com.muse.social.infrastructure.client.NotesServiceClient;
import com.muse.social.billing.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * BountyBoard Service - DDD Clean Architecture.
 * 
 * Location: domain/bounty/service
 * 
 * Integrations:
 * - ReputationService: Point deduction (create) and award (solve: 50 pts)
 * - FeatureFlagService: Tier protection (General ₹199+)
 * - NotesServiceClient: Note validation and linking
 * - NoteShareOrchestrator: D2F solution sharing
 * 
 * Business Rules:
 * - Creating bounty: Requires General tier or higher, costs 5 points
 * - Solving bounty: Awards 50 base + bounty reward + difficulty bonus
 * - Solution auto-shared to creator via D2F
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BountyService {

    private final BountyRepository bountyRepo;
    private final BountyAttemptRepository attemptRepo;
    private final ReputationService reputationService;
    private final FeatureFlagService featureFlags;
    private final NotesServiceClient notesClient;
    private final BountySolveOrchestrator bountySolveOrchestrator;
    private final RedisTemplate<String, Object> redisTemplate;

    // Points configuration
    private static final int POINTS_CREATE_COST = 5; // Deducted when creating
    private static final int POINTS_SOLVE_AWARD = 50; // Base award for solver
    private static final int POINTS_BONUS_HARD = 15;
    private static final int POINTS_BONUS_EXPERT = 30;

    // Required tier for bounties
    private static final String REQUIRED_FEATURE = "bounties_create";

    // ==================== CREATE BOUNTY ====================

    /**
     * Create a new bounty.
     * 
     * Requirements:
     * - User must be on General (₹199) tier or higher
     * - User must have enough reputation points
     * - Linked note must exist
     * 
     * @param userId  User creating the bounty
     * @param request Bounty creation request
     * @return Created bounty
     */
    @Transactional
    public Bounty createBounty(Long userId, CreateBountyRequest request) {
        // TIER PROTECTION: Check user is on ₹199+ tier
        featureFlags.requireFeature(userId, REQUIRED_FEATURE);

        // Validate linked note exists
        if (request.getLinkedNoteId() != null) {
            if (!notesClient.validateNoteAccess(request.getLinkedNoteId(), userId)) {
                throw new BountyOperationException("Linked note not found or inaccessible");
            }
        }

        // Check user has enough points
        int rewardPoints = request.getRewardPoints() != null ? request.getRewardPoints() : 10;
        reputationService.requireMinimumPoints(userId, rewardPoints + POINTS_CREATE_COST);

        // Create bounty entity
        Bounty bounty = Bounty.builder()
                .creatorId(userId)
                .linkedNoteId(request.getLinkedNoteId())
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "medium")
                .rewardPoints(rewardPoints)
                .status("open")
                .deadline(request.getDeadline())
                .tags(request.getTags())
                .build();

        bounty = bountyRepo.save(bounty);

        // DEDUCT POINTS from creator
        reputationService.addPoints(
                userId,
                -POINTS_CREATE_COST,
                "Created bounty: " + bounty.getTitle(),
                "bounty_create",
                bounty.getId());
        reputationService.incrementBountiesCreated(userId);

        // Organize linked note
        if (request.getLinkedNoteId() != null) {
            notesClient.autoOrganizeNoteAsync(userId, request.getLinkedNoteId(), "Bounty Problems");
        }

        // Publish event
        publishEvent("bounty_created", bounty);

        log.info("Bounty {} created by user {} (reward: {} pts)",
                bounty.getId(), userId, rewardPoints);

        return bounty;
    }

    // ==================== SUBMIT ATTEMPT ====================

    @Transactional
    public BountyAttempt submitAttempt(Long userId, Long bountyId, SubmitAttemptRequest request) {
        // Tier check for solving
        featureFlags.requireFeature(userId, "bounties_solve");

        Bounty bounty = getBountyOrThrow(bountyId);

        if (!"open".equals(bounty.getStatus())) {
            throw new BountyClosedException("Bounty is no longer accepting solutions");
        }

        if (bounty.getCreatorId().equals(userId)) {
            throw new BountyOperationException("Cannot solve your own bounty");
        }

        // Validate solution note
        if (request.getSolutionNoteId() != null) {
            if (!notesClient.validateNoteAccess(request.getSolutionNoteId(), userId)) {
                throw new BountyOperationException("Solution note not found");
            }
        }

        BountyAttempt attempt = BountyAttempt.builder()
                .bountyId(bountyId)
                .userId(userId)
                .solutionNoteId(request.getSolutionNoteId())
                .explanation(request.getExplanation())
                .status("pending")
                .build();

        attempt = attemptRepo.save(attempt);

        bounty.setAttemptCount(bounty.getAttemptCount() + 1);
        bountyRepo.save(bounty);

        log.info("Attempt {} submitted for bounty {} by user {}",
                attempt.getId(), bountyId, userId);

        return attempt;
    }

    // ==================== ACCEPT SOLUTION (Awards 50 pts) ====================

    /**
     * Accept a solution.
     * 
     * Awards:
     * - 50 base points (POINTS_SOLVE_AWARD)
     * - + bounty reward points
     * - + difficulty bonus (hard: 15, expert: 30)
     * 
     * Then:
     * - Links problem ↔ solution notes
     * - D2F shares solution to creator's "Bounty Solutions" folder
     */
    @Transactional
    public Bounty acceptSolution(Long userId, Long bountyId, Long attemptId) {
        Bounty bounty = getBountyOrThrow(bountyId);

        if (!bounty.getCreatorId().equals(userId)) {
            throw new BountyOperationException("Only bounty creator can accept solutions");
        }

        if (!"open".equals(bounty.getStatus())) {
            throw new BountyClosedException("Bounty already resolved");
        }

        BountyAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new BountyNotFoundException("Attempt not found: " + attemptId));

        // Update attempt
        attempt.setStatus("accepted");
        attempt.setReviewerId(userId);
        attempt.setReviewedAt(LocalDateTime.now());
        attemptRepo.save(attempt);

        // Update bounty
        bounty.setStatus("solved");
        bounty.setSolverId(attempt.getUserId());
        bounty.setSolutionNoteId(attempt.getSolutionNoteId());
        bounty.setSolvedAt(LocalDateTime.now());
        bountyRepo.save(bounty);

        // ORCHESTRATE SOLVE logic (Reputation + D2F Bridge)
        int rewardPoints = calculateSolverReward(bounty);
        bountySolveOrchestrator.orchestrateSolve(
                bounty,
                attempt.getUserId(),
                bounty.getCreatorId(),
                attempt.getSolutionNoteId(),
                rewardPoints);

        publishEvent("bounty_solved", bounty);

        log.info("Bounty {} solved by user {} (awarded {} pts)",
                bountyId, attempt.getUserId(), rewardPoints);

        return bounty;
    }

    /**
     * Calculate total reward for solver.
     * Base 50 + bounty reward + difficulty bonus.
     */
    private int calculateSolverReward(Bounty bounty) {
        int total = POINTS_SOLVE_AWARD + bounty.getRewardPoints();

        switch (bounty.getDifficulty()) {
            case "hard":
                total += POINTS_BONUS_HARD;
                break;
            case "expert":
                total += POINTS_BONUS_EXPERT;
                break;
        }

        return total;
    }

    // ==================== CANCEL BOUNTY ====================

    @Transactional
    public Bounty cancelBounty(Long userId, Long bountyId) {
        Bounty bounty = getBountyOrThrow(bountyId);

        if (!bounty.getCreatorId().equals(userId)) {
            throw new BountyOperationException("Only creator can cancel");
        }

        if (!"open".equals(bounty.getStatus())) {
            throw new BountyOperationException("Can only cancel open bounties");
        }

        bounty.setStatus("canceled");
        bountyRepo.save(bounty);

        // Partial refund
        reputationService.addPoints(
                userId,
                POINTS_CREATE_COST / 2,
                "Bounty cancellation refund",
                "bounty_cancel",
                bountyId);

        publishEvent("bounty_canceled", bounty);

        return bounty;
    }

    // ==================== QUERY METHODS ====================

    public Page<Bounty> getOpenBounties(Pageable pageable) {
        return bountyRepo.findByStatusOrderByCreatedAtDesc("open", pageable);
    }

    public Page<Bounty> getBountiesBySubject(String subject, Pageable pageable) {
        return bountyRepo.findBySubjectAndStatusOrderByCreatedAtDesc(subject, "open", pageable);
    }

    public Page<Bounty> searchBounties(String query, Pageable pageable) {
        return bountyRepo.searchBounties(query, "open", pageable);
    }

    public Bounty getBounty(Long bountyId) {
        Bounty bounty = getBountyOrThrow(bountyId);
        bounty.setViewCount(bounty.getViewCount() + 1);
        return bountyRepo.save(bounty);
    }

    public List<Bounty> getCreatedBounties(Long userId) {
        return bountyRepo.findByCreatorIdOrderByCreatedAtDesc(userId);
    }

    public List<Bounty> getSolvedBounties(Long userId) {
        return bountyRepo.findBySolverIdOrderByCreatedAtDesc(userId);
    }

    public List<BountyAttempt> getBountyAttempts(Long bountyId) {
        return attemptRepo.findByBountyIdOrderByCreatedAtDesc(bountyId);
    }

    // ==================== HELPERS ====================

    private Bounty getBountyOrThrow(Long bountyId) {
        return bountyRepo.findById(bountyId)
                .orElseThrow(() -> new BountyNotFoundException("Bounty not found: " + bountyId));
    }

    private void publishEvent(String type, Bounty bounty) {
        try {
            redisTemplate.convertAndSend("bounty:events", Map.of(
                    "type", type,
                    "bountyId", bounty.getId(),
                    "title", bounty.getTitle(),
                    "subject", bounty.getSubject() != null ? bounty.getSubject() : "general",
                    "status", bounty.getStatus(),
                    "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.debug("Failed to publish event: {}", e.getMessage());
        }
    }

    // ==================== EXCEPTIONS ====================

    public static class BountyNotFoundException extends RuntimeException {
        public BountyNotFoundException(String msg) {
            super(msg);
        }
    }

    public static class BountyClosedException extends RuntimeException {
        public BountyClosedException(String msg) {
            super(msg);
        }
    }

    public static class BountyOperationException extends RuntimeException {
        public BountyOperationException(String msg) {
            super(msg);
        }
    }
}
