package com.muse.social.feed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.social.feed.entity.Reaction;
import com.muse.social.feed.entity.UserInterest;
import com.muse.social.feed.repository.ReactionRepository;
import com.muse.social.feed.repository.UserInterestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserInterestRepository userInterestRepository;
    private final FeedWebSocketHandler feedWebSocketHandler; // Inject WebSocket handler
    private final ObjectMapper objectMapper; // Inject ObjectMapper

    public List<Reaction> getReactions(Long targetId, String targetType) {
        return reactionRepository.findByTargetIdAndTargetType(targetId, targetType);
    }

    public Reaction addReaction(Long userId, Long targetId, String targetType, String reactionType) {
        Reaction reaction = Reaction.builder()
                .userId(userId)
                .targetId(targetId)
                .targetType(targetType)
                .reactionType(reactionType)
                .build();
        Reaction savedReaction = reactionRepository.save(reaction);

        // Track interest based on reaction
        if ("POST".equals(targetType)) {
            userInterestRepository.findByUserIdAndInterestTypeAndInterestValue(userId, "REACTION_TYPE", reactionType)
                    .ifPresentOrElse(
                            interest -> { /* Update existing interest if needed */ },
                            () -> userInterestRepository.save(UserInterest.builder()
                                    .userId(userId)
                                    .interestType("REACTION_TYPE")
                                    .interestValue(reactionType)
                                    .build())
                    );
        }
        // Broadcast new reaction
        try {
            feedWebSocketHandler.broadcastToAll(objectMapper.writeValueAsString(Map.of("type", "new_reaction", "reaction", savedReaction)));
        } catch (IOException e) {
            // Log error
        }
        return savedReaction;
    }

    public void removeReaction(Long reactionId, Long userId) {
        reactionRepository.findById(reactionId)
                .filter(reaction -> reaction.getUserId().equals(userId))
                .ifPresent(reaction -> {
                    reactionRepository.delete(reaction);
                    // Broadcast deleted reaction
                    try {
                        feedWebSocketHandler.broadcastToAll(objectMapper.writeValueAsString(Map.of("type", "delete_reaction", "reactionId", reactionId)));
                    } catch (IOException e) {
                        // Log error
                    }
                });
    }
}
