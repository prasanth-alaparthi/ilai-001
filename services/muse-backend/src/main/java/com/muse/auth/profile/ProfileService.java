// File: auth-service/src/main/java/com/muse/auth/profile/ProfileService.java
package com.muse.auth.profile;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final AuthServiceClient authServiceClient;
    private final FollowRepository followRepository;
    private final UserStatsRepository userStatsRepository;

    public Optional<Profile> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }

    public Mono<Optional<Profile>> getProfileByUsername(String username) {
        return authServiceClient.getUserByUsername(username)
                .flatMap(userDto -> Mono.justOrEmpty(profileRepository.findByUserId(userDto.getId())))
                .map(Optional::of)
                .defaultIfEmpty(Optional.empty());
    }

    @Transactional
    public Profile createOrUpdateProfile(Long userId, Profile payload) {
        Profile p = profileRepository.findByUserId(userId).orElseGet(() -> {
            Profile np = new Profile();
            np.setUserId(userId);
            np.setCreatedAt(Instant.now());
            return np;
        });
        if (payload.getDisplayName() != null) p.setDisplayName(payload.getDisplayName());
        if (payload.getBio() != null) p.setBio(payload.getBio());
        if (payload.getAvatarUrl() != null) p.setAvatarUrl(payload.getAvatarUrl());
        if (payload.getLocation() != null) p.setLocation(payload.getLocation());
        if (payload.getWebsite() != null) p.setWebsite(payload.getWebsite());
        if (payload.getInterests() != null) p.setInterests(payload.getInterests());
        p.setPrivacyProfile(payload.getPrivacyProfile() == null ? "PUBLIC" : payload.getPrivacyProfile());
        p.setUpdatedAt(Instant.now());
        return profileRepository.save(p);
    }

    public List<Follow> listFollowing(String username) {
        return followRepository.findByFollowerUsernameOrderByCreatedAtDesc(username);
    }

    public List<Follow> listFollowers(String username) {
        return followRepository.findByFolloweeUsernameOrderByCreatedAtDesc(username);
    }
}
