package com.muse.auth.profile;

import com.muse.auth.client.AuthServiceClient;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final FollowService followService;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return Mono.justOrEmpty(Optional.empty());
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId());
    }

    @GetMapping("/me")
    public Mono<ResponseEntity<?>> myProfile(Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) return Mono.just(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
            Optional<Profile> p = profileService.getProfileByUserId(userId);
            return Mono.just(p.<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.ok(Map.of("message", "profile_not_found"))));
        });
    }

    @PutMapping("/me")
    public Mono<ResponseEntity<?>> updateProfile(Authentication auth, @Valid @RequestBody ProfileDto payload) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) return Mono.just(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
            Profile toSave = Profile.builder()
                    .userId(userId)
                    .displayName(payload.getDisplayName())
                    .bio(payload.getBio())
                    .avatarUrl(payload.getAvatarUrl())
                    .location(payload.getLocation())
                    .website(payload.getWebsite())
                    .interests(payload.getInterests())
                    .privacyProfile(payload.getPrivacyProfile())
                    .build();
            Profile updated = profileService.createOrUpdateProfile(userId, toSave);
            return Mono.just(ResponseEntity.ok(updated));
        });
    }

    @GetMapping("/{username}")
    public Mono<ResponseEntity<?>> getProfile(@PathVariable String username) {
        return profileService.getProfileByUsername(username)
                .map(p -> p.<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "not_found"))));
    }

    @PostMapping("/{username}/follow")
    public Mono<ResponseEntity<?>> follow(@PathVariable String username, Authentication auth) {
        if (auth == null) return Mono.just(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
        String me = auth.getName();
        return followService.follow(me, username)
                .map(f -> ResponseEntity.ok(Map.of("status", "success", "follow", f)));
    }

    @DeleteMapping("/{username}/follow")
    public Mono<ResponseEntity<?>> unfollow(@PathVariable String username, Authentication auth) {
        if (auth == null) return Mono.just(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
        String me = auth.getName();
        return followService.unfollow(me, username)
                .map(ok -> ResponseEntity.ok(Map.of("status", ok ? "success" : "noop")));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<?> followers(@PathVariable String username) {
        var list = profileService.listFollowers(username);
        var simplified = list.stream().map(f -> Map.of(
                "followerUsername", f.getFollowerUsername(),
                "createdAt", f.getCreatedAt()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(simplified);
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<?> following(@PathVariable String username) {
        var list = profileService.listFollowing(username);
        var simplified = list.stream().map(f -> Map.of(
                "followeeUsername", f.getFolloweeUsername(),
                "createdAt", f.getCreatedAt()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(simplified);
    }
}
