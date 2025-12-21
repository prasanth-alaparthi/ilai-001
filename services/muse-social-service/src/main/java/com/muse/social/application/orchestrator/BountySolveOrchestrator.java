package com.muse.social.application.orchestrator;

import com.muse.social.domain.bounty.entity.Bounty;
import com.muse.social.domain.reputation.service.ReputationService;
import com.muse.social.infrastructure.client.AuthServiceClient;
import com.muse.social.infrastructure.client.NotesServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

/**
 * BountySolveOrchestrator - The Production Bridge.
 * 
 * Handles bounty solve with:
 * 1. Redis tier verification
 * 2. Reputation point awarding
 * 3. WebClient retry logic for note injection
 * 4. Compensation (rollback) if injection fails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BountySolveOrchestrator {

        private final ReputationService reputationService;
        private final AuthServiceClient authClient;
        private final NotesServiceClient notesClient;
        private final StringRedisTemplate redisTemplate;

        /**
         * Orchestrate the bounty solve with tier verification and compensation logic.
         * Executes asynchronously to prevent blocking thread pool.
         */
        @Async
        public CompletableFuture<Void> orchestrateSolve(Bounty bounty, Long solverId, Long creatorId,
                        Long solutionNoteId,
                        int rewardPoints) {
                log.info("Orchestrating bounty solve for '{}' (ID: {})", bounty.getTitle(), bounty.getId());

                try {
                        // Step 1: Verify solver tier (must be General or higher)
                        String solverTier = getTierFromRedis(solverId);
                        if ("free".equalsIgnoreCase(solverTier)) {
                                throw new InsufficientTierException("Bounty solving requires General tier (₹199+)");
                        }
                        log.debug("Solver {} tier verified: {}", solverId, solverTier);

                        // Step 2: Award reputation points
                        reputationService.addPoints(
                                        solverId,
                                        rewardPoints,
                                        "Solved bounty: " + bounty.getTitle(),
                                        "bounty_solve",
                                        bounty.getId());
                        reputationService.incrementBountiesSolved(solverId);
                        log.info("Awarded {} points to solver {}", rewardPoints, solverId);

                        // Step 3: Fetch solver's display name
                        String solverUsername = authClient.getDisplayName(solverId);
                        String folderPath = "Shared Notes/From " + solverUsername;

                        // Step 4: Inject note with retry and compensation (non-blocking)
                        CompletableFuture<Void> future = new CompletableFuture<>();

                        notesClient.injectSharedNote(creatorId, solutionNoteId, folderPath, solverUsername)
                                        .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                                                        .maxBackoff(Duration.ofSeconds(10))
                                                        .doBeforeRetry(signal -> log.warn(
                                                                        "Retrying note injection (attempt {}): {}",
                                                                        signal.totalRetries() + 1,
                                                                        signal.failure().getMessage())))
                                        .subscribe(
                                                        v -> {
                                                                log.info("Successfully injected solution note {} into creator {}'s folder",
                                                                                solutionNoteId, creatorId);
                                                                log.info("Bounty solve orchestration complete for bounty {}",
                                                                                bounty.getId());
                                                                future.complete(null);
                                                        },
                                                        error -> {
                                                                log.error("Note injection failed after retries, initiating compensation",
                                                                                error);
                                                                compensateFailedInjection(solverId, rewardPoints,
                                                                                bounty);
                                                                future.completeExceptionally(
                                                                                new OrchestrationException(
                                                                                                "Failed to orchestrate bounty solve",
                                                                                                error));
                                                        });

                        return future;

                } catch (InsufficientTierException e) {
                        log.warn("Tier verification failed for solver {}: {}", solverId, e.getMessage());
                        return CompletableFuture.failedFuture(e);
                } catch (Exception e) {
                        log.error("Orchestration failed for bounty {}", bounty.getId(), e);
                        return CompletableFuture.failedFuture(
                                        new OrchestrationException("Failed to orchestrate bounty solve", e));
                }
        }

        /**
         * Get user tier from Redis with <3ms performance.
         */
        private String getTierFromRedis(Long userId) {
                try {
                        String tier = redisTemplate.opsForValue().get("user:" + userId + ":tier");
                        return tier != null ? tier : "free";
                } catch (Exception e) {
                        log.warn("Redis tier lookup failed for user {}, defaulting to 'free'", userId, e);
                        return "free";
                }
        }

        /**
         * Compensation logic: Rollback reputation points if note injection fails.
         */
        private void compensateFailedInjection(Long solverId, int rewardPoints, Bounty bounty) {
                try {
                        reputationService.addPoints(
                                        solverId,
                                        -rewardPoints,
                                        "Rollback: Failed note injection for bounty " + bounty.getTitle(),
                                        "bounty_solve_rollback",
                                        bounty.getId());
                        reputationService.decrementBountiesSolved(solverId);
                        log.info("Compensation complete: Rolled back {} points from solver {}", rewardPoints, solverId);
                } catch (Exception e) {
                        log.error("CRITICAL: Compensation failed for solver {}. Manual intervention required.",
                                        solverId, e);
                }
        }

        /**
         * Exception thrown when user tier is insufficient.
         */
        public static class InsufficientTierException extends RuntimeException {
                public InsufficientTierException(String message) {
                        super(message);
                }
        }

        /**
         * Exception thrown when orchestration fails.
         */
        public static class OrchestrationException extends RuntimeException {
                public OrchestrationException(String message, Throwable cause) {
                        super(message, cause);
                }
        }
}
