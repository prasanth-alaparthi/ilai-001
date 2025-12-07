package com.muse.auth.chat;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.muse.auth.chat.KeyRegistryService;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional; // Explicitly added import

@RestController
@RequestMapping("/v1/keys")
@RequiredArgsConstructor
public class ClaimPreKeyController {

    private final KeyRegistryService keyRegistryService;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return Mono.justOrEmpty(Optional.empty());
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId());
    }

    /**
     * POST /v1/keys/claim?targetUserId=...&targetDeviceId=...
     */
    @PostMapping("/claim")
    public Mono<ResponseEntity<?>> claim(@RequestParam Long targetUserId, @RequestParam String targetDeviceId, Authentication auth) {
        return resolveUserId(auth).flatMap(callerId -> {
            if (callerId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
            }

            var prekey = keyRegistryService.claimPreKey(targetUserId, targetDeviceId, callerId);
            if (prekey == null) {
                return Mono.just(ResponseEntity.status(404).body(Map.of("error", "no-prekeys-available")));
            }

            return Mono.just(ResponseEntity.ok(Map.of(
                    "keyId", prekey.get("keyId"),
                    "publicKey", prekey.get("publicKey")
            )));
        });
    }
}
