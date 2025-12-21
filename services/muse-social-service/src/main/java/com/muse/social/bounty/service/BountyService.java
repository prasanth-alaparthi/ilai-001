package com.muse.social.bounty.service;

import com.muse.social.bounty.dto.*;
import com.muse.social.bounty.entity.Bounty;
import com.muse.social.bounty.entity.BountyAttempt;
import com.muse.social.bounty.repository.BountyRepository;
import com.muse.social.bounty.repository.BountyAttemptRepository;
import com.muse.social.client.NotesServiceClient;
import com.muse.social.reputation.service.ReputationService;
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
 * BountyBoard Service - Clean Architecture Implementation.
 * 
 * Orchestrates:
 * - ReputationService: Point deduction/award
 * - NotesServiceClient: Note validation and linking
 * - FeatureFlagService: Tier-based access control
 * 
 * Business Rules:
 * - Creating a bounty costs 5 points (deducted from creator)
 * - Solving a bounty awards base 20 + bounty reward + difficulty bonus
 * - Notes are auto-organized into "Bounty Solutions" folder
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
    private final RedisTemplate<String, Object> redisTemplate;

    // Points configuration
    private static final int POINTS_CREATE_BOUNTY = -5; // Costs points to create
    private static final int POINTS_SOLVE_BASE = 20; // Base award for solving
    private static final int POINTS_BONUS_HARD = 15;
    private static final int POINTS_BONUS_EXPERT = 30;

    // Folder names for "Headache-Free" organization
    private static final String FOLDER_BOUNTY_PROBLEMS = "Bounty Problems";
    private static final String FOLDER_BOUNTY_SOLUTIONS = "Bounty Solutions";

    /**
     * Create a new bounty.
     * 
     * Flow:
     * 1. Check feature access (bounties_create)
     * 2. Validate linked note exists (if provided)
     * 3. Check minimum reputation
     * 4. Create bounty record
     * 5. Deduct points from creator
     * 6. Auto-organize linked note into "Bounty Problems" folder
     * 7. Publish event for real-time updates
     */
    @Transactional
    public Bounty createBounty(Long userId, CreateBountyRequest request) {
        // 1. Check tier access
        featureFlags.requireFeature(userId, "bounties_create");

        // 2. Validate linked note
        if (request.getLinkedNoteId() != null) {
            if (!notesClient.validateNoteAccess(request.getLinkedNoteId(), userId)) {
                throw new InvalidBountyOperationException(
                        "Note not found or you don't have access: " + request.getLinkedNoteId());
            }
        }

        // 3. Check minimum reputation (must have at least reward points)
        int rewardPoints = request.getRewardPoints() != null ? request.getRewardPoints() : 10;
        reputationService.requireMinimumPoints(userId, rewardPoints);

        // 4. Create bounty
        Bounty bounty = Bounty.builder()
                .creatorId(userId)
                .linkedNoteId(request.getLinkedNoteId())
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "medium")
                .rewardPoints(rewardPoints)
                .deadline(request.getDeadline())
                .tags(request.getTags())
                .build();

        bounty = bountyRepo.save(bounty);

        // 5. Deduct points
        reputationService.addPoints(
                userId,
                POINTS_CREATE_BOUNTY,
                "Created bounty: " + bounty.getTitle(),
                "bounty",
                bounty.getId());
        reputationService.incrementBountiesCreated(userId);

        // 6. Auto-organize linked note (async, fire-and-forget)
        if (request.getLinkedNoteId() != null) {
            notesClient.autoOrganizeNoteAsync(userId, request.getLinkedNoteId(), FOLDER_BOUNTY_PROBLEMS)
                    .subscribe();
            notesClient.addTagsToNote(request.getLinkedNoteId(), userId, "bounty", "problem");
        }

        // 7. Publish event
        publishBountyEvent("created", bounty);

        log.info("Bounty {} created by user {} (reward: {} pts)",
                bounty.getId(), userId, rewardPoints);

        return bounty;
    }

    /**
     * Submit a solution attempt.
     */
    @Transactional
    public BountyAttempt submitAttempt(Long userId, Long bountyId, SubmitAttemptRequest request) {
        // Check feature access
        featureFlags.requireFeature(userId, "bounties_solve");

        Bounty bounty = getBountyById(bountyId);

        // Validate bounty is open
        if (!bounty.isOpen()) {
            throw new BountyClosedException("Bounty is no longer open for solutions");
        }

        // Can't solve own bounty
        if (bounty.getCreatorId().equals(userId)) {
            throw new InvalidBountyOperationException("Cannot solve your own bounty");
        }

        // Validate solution note
        if (request.getSolutionNoteId() != null) {
            if (!notesClient.validateNoteAccess(request.getSolutionNoteId(), userId)) {
                throw new InvalidBountyOperationException(
                        "Solution note not found: " + request.getSolutionNoteId());
            }
        }

        // Create attempt
        BountyAttempt attempt = BountyAttempt.builder()
                .bountyId(bountyId)
                .userId(userId)
                .solutionNoteId(request.getSolutionNoteId())
                .explanation(request.getExplanation())
                .build();

        attempt = attemptRepo.save(attempt);

        // Increment attempt count
        bounty.setAttemptCount(bounty.getAttemptCount() + 1);
        bountyRepo.save(bounty);

        log.info("Attempt {} submitted for bounty {} by user {}",
                attempt.getId(), bountyId, userId);

        return attempt;
    }

    /**
     * Accept a solution (by bounty creator).
     * 
     * Flow:
     * 1. Verify creator is accepting
     * 2. Mark attempt as accepted
     * 3. Mark bounty as solved
     * 4. Award points to solver
     * 5. Link problem note ↔ solution note
     * 6. Auto-organize solution into "Bounty Solutions" folder
     * 7. Publish event
     */
    @Transactional
    public Bounty acceptSolution(Long userId, Long bountyId, Long attemptId) {
        Bounty bounty = getBountyById(bountyId);

        // 1. Only creator can accept
        if (!bounty.getCreatorId().equals(userId)) {
            throw new InvalidBountyOperationException("Only the bounty creator can accept solutions");
        }

        BountyAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new BountyNotFoundException("Attempt not found: " + attemptId));

        // 2. Update attempt
        attempt.setStatus("accepted");
        attempt.setReviewerId(userId);
        attempt.setReviewedAt(LocalDateTime.now());
        attemptRepo.save(attempt);

        // 3. Update bounty
        bounty.setStatus("solved");
        bounty.setSolverId(attempt.getUserId());
        bounty.setSolutionNoteId(attempt.getSolutionNoteId());
        bounty.setSolvedAt(LocalDateTime.now());
        bountyRepo.save(bounty);

        // 4. Award points to solver
        int rewardPoints = calculateRewardPoints(bounty);
        reputationService.addPoints(
                attempt.getUserId(),
                rewardPoints,
                "Solved bounty: " + bounty.getTitle(),
                "bounty",
                bounty.getId());
        reputationService.incrementBountiesSolved(attempt.getUserId());

        // 5. Link notes (problem ↔ solution)
        if (bounty.getLinkedNoteId() != null && attempt.getSolutionNoteId() != null) {
            notesClient.linkNotes(
                    bounty.getLinkedNoteId(),
                    attempt.getSolutionNoteId(),
                    "solution",
                    bounty.getCreatorId());
        }

        // 6. Auto-organize solution note ("Headache-Free")
        if (attempt.getSolutionNoteId() != null) {
            notesClient.autoOrganizeNote(
                    attempt.getUserId(),
                    attempt.getSolutionNoteId(),
                    FOLDER_BOUNTY_SOLUTIONS);
            notesClient.addTagsToNote(
                    attempt.getSolutionNoteId(),
                    attempt.getUserId(),
                    "bounty", "solution", bounty.getSubject());
        }

        // 7. Publish event
        publishBountyEvent("solved", bounty);

        log.info("Bounty {} solved by user {} (awarded {} pts)",
                bountyId, attempt.getUserId(), rewardPoints);

        return bounty;
    }

    /**
     * Calculate total reward points including bonuses.
     */
    private int calculateRewardPoints(Bounty bounty) {
        int total = POINTS_SOLVE_BASE + bounty.getRewardPoints();

        if ("hard".equals(bounty.getDifficulty())) {
            total += POINTS_BONUS_HARD;
        } else if ("expert".equals(bounty.getDifficulty())) {
            total += POINTS_BONUS_EXPERT;
        }

        return total;
    }

    /**
     * Cancel a bounty (by creator, before solved).
     */
    @Transactional
    public Bounty cancelBounty(Long userId, Long bountyId) {
        Bounty bounty = getBountyById(bountyId);

        if (!bounty.getCreatorId().equals(userId)) {
            throw new InvalidBountyOperationException("Only the creator can cancel the bounty");
        }

        if (!bounty.isOpen()) {
            throw new InvalidBountyOperationException("Can only cancel open bounties");
        }

        bounty.setStatus("canceled");
        bountyRepo.save(bounty);

        // Refund half the creation cost
        reputationService.addPoints(
                userId,
                Math.abs(POINTS_CREATE_BOUNTY) / 2,
                "Bounty cancellation refund",
                "bounty",
                bountyId);

        publishBountyEvent("canceled", bounty);

        log.info("Bounty {} cancelled by user {}", bountyId, userId);

        return bounty;
    }

    // ==================== Query Methods ====================

    public Page<Bounty> getOpenBounties(Pageable pageable) {
        return bountyRepo.findByStatusOrderByCreatedAtDesc("open", pageable);
    }

    public Page<Bounty> getBountiesBySubject(String subject, Pageable pageable) {
        return bountyRepo.findBySubjectAndStatusOrderByCreatedAtDesc(subject, "open", pageable);
    }

    public Page<Bounty> searchBounties(String query, Pageable pageable) {
        return bountyRepo.searchBounties(query, "open", pageable);
    }

    public Page<Bounty> getTrendingBounties(Pageable pageable) {
        return bountyRepo.findTrending(pageable);
    }

    public Bounty getBounty(Long bountyId) {
        Bounty bounty = getBountyById(bountyId);

        // Increment view count
        bounty.setViewCount(bounty.getViewCount() + 1);
        bountyRepo.save(bounty);

        return bounty;
    }

    public List<Bounty> getCreatedBounties(Long userId) {
        return bountyRepo.findByCreatorIdOrderByCreatedAtDesc(userId);
    }

    public List<Bounty> getSolvedBounties(Long userId) {
        return bountyRepo.findBySolverIdOrderByCreatedAtDesc(userId);
    }

    // ==================== Helper Methods ====================

    private Bounty getBountyById(Long bountyId) {
        return bountyRepo.findById(bountyId)
                .orElseThrow(() -> new BountyNotFoundException("Bounty not found: " + bountyId));
    }

    private void publishBountyEvent(String eventType, Bounty bounty) {
        try {
            redisTemplate.convertAndSend("bounty:events", Map.of(
                    "type", eventType,
                    "bountyId", bounty.getId(),
                    "title", bounty.getTitle(),
                    "subject", bounty.getSubject() != null ? bounty.getSubject() : "general",
                    "rewardPoints", bounty.getRewardPoints(),
                    "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.debug("Failed to publish bounty event: {}", e.getMessage());
        }
    }

    // ==================== Exception Classes ====================

    public static class BountyNotFoundException extends RuntimeException {
        public BountyNotFoundException(String message) {
            super(message);
        }
    }

    public static class BountyClosedException extends RuntimeException {
        public BountyClosedException(String message) {
            super(message);
        }
    }

    public static class InvalidBountyOperationException extends RuntimeException {
        public InvalidBountyOperationException(String message) {
            super(message);
        }
    }
}
