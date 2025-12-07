package com.muse.auth.chat;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.muse.auth.chat.MessageService;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@RestController
@RequestMapping("/v1/messages")
@RequiredArgsConstructor
public class MessageRelayController {

    private final MessageService messageService;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null)
            return Mono.justOrEmpty(Optional.empty());

        String token = null;
        if (auth instanceof JwtAuthenticationToken) {
            token = ((JwtAuthenticationToken) auth).getToken().getTokenValue();
        }

        if (token == null) {
            // Fallback or error if not JWT (shouldn't happen with ResourceServerConfig)
            return Mono.justOrEmpty(Optional.empty());
        }

        return authServiceClient.getUserByUsername(auth.getName(), token)
                .map(userDto -> userDto.getId());
    }

    @PostMapping("/send")
    public Mono<ResponseEntity<?>> send(@RequestBody Map<String, Object> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) {
                return Mono.just(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
            }
            messageService.saveAndDispatch(userId, body);
            return Mono.just(ResponseEntity.ok(Map.of("status", "queued")));
        });
    }
}
