package com.muse.auth.chat;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/v1/groups")
@RequiredArgsConstructor
public class SenderKeyController {

    private final SenderKeyService senderKeyService;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return Mono.justOrEmpty(Optional.empty());
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId());
    }

    @PostMapping("/{groupId}/senderkey")
    public Mono<ResponseEntity<?>> postEnvelopes(@PathVariable Long groupId, @RequestBody Map<String,Object> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            }
            // body: envelopes: [{targetUserId, targetDeviceId, envelope}]
            List<Map<String,Object>> envelopes = (List<Map<String,Object>>) body.get("envelopes");
            senderKeyService.storeEnvelopes(groupId, userId, envelopes);
            return Mono.just(ResponseEntity.ok(Map.of("status","ok")));
        });
    }

    @GetMapping("/{groupId}/envelopes")
    public Mono<ResponseEntity<?>> fetchForDevice(@PathVariable Long groupId, @RequestParam String deviceId, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            }
            var list = senderKeyService.fetchPendingEnvelopes(userId, deviceId);
            return Mono.just(ResponseEntity.ok(Map.of("envelopes", list)));
        });
    }

    @PostMapping("/envelopes/{id}/consume")
    public Mono<ResponseEntity<?>> consumeEnvelope(@PathVariable Long id, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            }
            senderKeyService.markConsumed(id);
            return Mono.just(ResponseEntity.ok(Map.of("status","consumed")));
        });
    }
}
