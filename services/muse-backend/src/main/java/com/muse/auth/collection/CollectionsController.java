package com.muse.auth.collection;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class CollectionsController {

    private final CollectionRepository repo;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return Mono.justOrEmpty(Optional.empty());
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId());
    }

    @GetMapping("/me")
    public Mono<ResponseEntity<?>> mine(Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            }
            return Mono.just(ResponseEntity.ok(Map.of("collections", repo.findByOwnerUserIdOrderByCreatedAtDesc(userId))));
        });
    }

    @PostMapping
    public Mono<ResponseEntity<?>> create(@RequestBody Map<String,String> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            }
            String name = body.getOrDefault("name","Untitled");
            String desc = body.getOrDefault("description","");
            CollectionEntity c = CollectionEntity.builder()
                    .ownerUserId(userId)
                    .name(name)
                    .description(desc)
                    .itemCount(0)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            repo.save(c);
            return Mono.just(ResponseEntity.ok(c));
        });
    }
}
