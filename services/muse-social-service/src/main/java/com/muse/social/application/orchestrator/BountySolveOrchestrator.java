package com.muse.social.application.orchestrator;

import com.muse.social.domain.bounty.entity.Bounty;
import com.muse.social.domain.reputation.service.ReputationService;
import com.muse.social.infrastructure.client.AuthServiceClient;
import com.muse.social.infrastructure.client.NotesServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * BountySolveOrchestrator - The Bridge.
 * 
 * Handles the logic when a bounty is SOLVED:
 * 1. Award +50 points to solver.
 * 2. Fetch solver's username from auth-service.
 * 3. Trigger D2F injection of solution note into creator's folder.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BountySolveOrchestrator {

        private final ReputationService reputationService;
        private final AuthServiceClient authClient;
        private final NotesServiceClient notesClient;

        /**
         * Orchestrate the bounty solve logic.
         * 
         * @param bounty         The solved bounty
         * @param solverId       ID of the solver
         * @param creatorId      ID of the bounty creator
         * @param solutionNoteId ID of the solution note
         */
        public void orchestrateSolve(Bounty bounty, Long solverId, Long creatorId, Long solutionNoteId,
                        int rewardPoints) {
                log.info("Orchestrating solve for bounty '{}' (ID: {})", bounty.getTitle(), bounty.getId());

                // 1. Reputation: Award points to the solver
                reputationService.addPoints(
                                solverId,
                                rewardPoints,
                                "Solved bounty: " + bounty.getTitle(),
                                "bounty_solve",
                                bounty.getId());

                reputationService.incrementBountiesSolved(solverId);

                // 2. Auth Check: Fetch the solver's username
                String solverUsername = authClient.getDisplayName(solverId); // Assuming display name is used as
                                                                             // identifier here

                // 3. The Bridge: Trigger D2F injection
                // Folder Rule: Shared Notes / From [SolverUsername]
                String folderPath = "Shared Notes/From " + solverUsername;

                notesClient.injectSharedNote(creatorId, solutionNoteId, folderPath, solverUsername)
                                .subscribe(
                                                success -> log.info(
                                                                "Successfully linked solution note {} to creator {}'s folder",
                                                                solutionNoteId, creatorId),
                                                error -> log.error("Failed to link solution note to creator folder: {}",
                                                                error.getMessage()));

                log.info("Bounty solve orchestration complete for bounty {}", bounty.getId());
        }
}
