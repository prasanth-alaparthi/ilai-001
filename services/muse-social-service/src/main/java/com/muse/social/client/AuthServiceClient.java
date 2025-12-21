package com.muse.social.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

/**
 * Client for inter-service communication with muse-auth-service.
 * 
 * Used for:
 * - Fetching user profiles
 * - Validating user existence
 * - Getting user display names
 */
@Component
@Slf4j
public class AuthServiceClient {

    private final WebClient webClient;
    private final Duration timeout;

    public AuthServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${services.auth.url:http://muse-auth-service:8081}") String authServiceUrl,
            @Value("${services.auth.timeout:3000}") long timeoutMs) {
        this.webClient = webClientBuilder
                .baseUrl(authServiceUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    /**
     * Get user's public profile.
     */
    public Map<String, Object> getUserProfile(Long userId) {
        try {
            return webClient.get()
                    .uri("/api/users/{userId}", userId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();
        } catch (Exception e) {
            log.debug("Failed to get profile for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * Get user's display name.
     */
    public String getDisplayName(Long userId) {
        Map<String, Object> profile = getUserProfile(userId);
        if (profile != null) {
            return (String) profile.getOrDefault("displayName",
                    profile.getOrDefault("username", "User " + userId));
        }
        return "User " + userId;
    }

    /**
     * Check if user exists.
     */
    public boolean userExists(Long userId) {
        return getUserProfile(userId) != null;
    }
}
