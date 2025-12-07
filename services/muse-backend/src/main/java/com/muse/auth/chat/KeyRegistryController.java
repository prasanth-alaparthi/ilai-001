package com.muse.auth.chat;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/v1/keys")
@RequiredArgsConstructor
public class KeyRegistryController {

    private final KeyRegistryService keyRegistryService;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return Mono.justOrEmpty(Optional.empty());
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId());
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<?>> register(@RequestBody Map<String,Object> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            }
            // body must include deviceId, identityKey, signedPrekey, signedPrekeySig, prekeys (optional)
            keyRegistryService.saveDeviceKeys(userId, body);
            return Mono.just(ResponseEntity.ok(Map.of("status","ok")));
        });
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getKeys(@PathVariable Long userId) {
        Map<String,Object> payload = keyRegistryService.getPublicKeys(userId);
        return ResponseEntity.ok(payload);
    }
}
