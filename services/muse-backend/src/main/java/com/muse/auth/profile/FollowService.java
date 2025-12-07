// File: auth-service/src/main/java/com/muse/auth/profile/FollowService.java
package com.muse.auth.profile;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final AuthServiceClient authServiceClient;
    private final UserStatsRepository userStatsRepository;

    @Transactional
    public Mono<Follow> follow(String followerUsername, String followeeUsername) {
        if (followerUsername.equalsIgnoreCase(followeeUsername)) {
            return Mono.error(new IllegalArgumentException("Cannot follow yourself"));
        }
        Optional<Follow> existing = followRepository.findByFollowerUsernameAndFolloweeUsername(followerUsername, followeeUsername);
        if (existing.isPresent()) {
            return Mono.just(existing.get());
        }

        return authServiceClient.getUserByUsername(followeeUsername)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Followee not found")))
                .flatMap(followeeUserDto -> {
                    Follow f = Follow.builder()
                            .followerUsername(followerUsername)
                            .followeeUsername(followeeUsername)
                            .status("ACTIVE")
                            .createdAt(Instant.now())
                            .build();

                    Follow saved = followRepository.save(f);

                    // update counters (best-effort)
                    // Use then() to ensure the Mono completes after the side effect, but doesn't change the main flow's return type
                    Mono<Void> incrementFollowersMono = authServiceClient.getUserByUsername(followeeUserDto.getUsername())
                            .doOnSuccess(u -> userStatsRepository.incrementFollowers(u.getId()))
                            .then();
                    Mono<Void> incrementFollowingMono = authServiceClient.getUserByUsername(followerUsername)
                            .doOnSuccess(u -> userStatsRepository.incrementFollowing(u.getId()))
                            .then();

                    return Mono.when(incrementFollowersMono, incrementFollowingMono) // Combine side effects
                            .thenReturn(saved); // Return the saved Follow object
                });
    }

    @Transactional
    public Mono<Boolean> unfollow(String followerUsername, String followeeUsername) {
        Optional<Follow> existing = followRepository.findByFollowerUsernameAndFolloweeUsername(followerUsername, followeeUsername);
        if (existing.isPresent()) {
            followRepository.delete(existing.get());
            Mono<Void> decrementFollowersMono = authServiceClient.getUserByUsername(followeeUsername)
                    .doOnSuccess(u -> userStatsRepository.decrementFollowers(u.getId()))
                    .then();
            Mono<Void> decrementFollowingMono = authServiceClient.getUserByUsername(followerUsername)
                    .doOnSuccess(u -> userStatsRepository.decrementFollowing(u.getId()))
                    .then();

            return Mono.when(decrementFollowersMono, decrementFollowingMono)
                    .thenReturn(true);
        }
        return Mono.just(false);
    }
}
