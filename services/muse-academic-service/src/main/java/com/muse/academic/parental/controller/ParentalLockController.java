package com.muse.academic.parental.controller;

import com.muse.academic.parental.client.AuthServiceClient;
import com.muse.academic.parental.service.ParentalLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/parental")
@RequiredArgsConstructor
@Slf4j
public class ParentalLockController {

    private final ParentalLockService service;
    private final AuthServiceClient authServiceClient;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null)
            return Mono.empty();
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId())
                .onErrorResume(e -> {
                    log.warn("Error resolving user ID for {}: {}", auth.getName(), e.getMessage());
                    return Mono.empty();
                });
    }

    @PostMapping("/pin/setup")
    public Mono<ResponseEntity<?>> setupPin(@RequestBody Map<String, String> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            String pin = body.get("pin");
            if (pin == null || pin.length() < 4)
                return Mono.<ResponseEntity<?>>just(ResponseEntity.badRequest().body(Map.of("error", "pin_too_short")));
            service.setupPin(userId, pin);
            return Mono.<ResponseEntity<?>>just(ResponseEntity.ok(Map.of("status", "ok")));
        }).defaultIfEmpty(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
    }

    @PostMapping("/pin/verify")
    public Mono<ResponseEntity<?>> verify(@RequestBody Map<String, String> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            String pin = body.get("pin");
            boolean ok = service.verifyPin(userId, pin);
            return Mono.<ResponseEntity<?>>just(ResponseEntity.ok(Map.<String, Object>of("verified", ok)));
        }).defaultIfEmpty(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
    }

    @GetMapping("/pin/status")
    public Mono<ResponseEntity<?>> status(Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            boolean enabled = service.isEnabled(userId);
            return Mono.<ResponseEntity<?>>just(ResponseEntity.ok(Map.<String, Object>of("enabled", enabled)));
        }).defaultIfEmpty(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
    }

    @PostMapping("/pin/remove")
    public Mono<ResponseEntity<?>> remove(Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            service.removePin(userId);
            return Mono.<ResponseEntity<?>>just(ResponseEntity.ok(Map.of("status", "removed")));
        }).defaultIfEmpty(ResponseEntity.status(401).body(Map.of("error", "unauthenticated")));
    }
}
