package com.muse.social.infrastructure.client;

import com.muse.social.feed.dto.UserDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

/**
 * Auth Service Client with Resilience4j protection.
 * 
 * Used for:
 * - Fetching user display names
 * - Validating user existence
 * - Getting user profiles for notifications
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
     * Get user's display name.
     * Used for "From [Student B Name]" folder naming.
     * 
     * @param userId User ID
     * @return Display name or "User {id}" as fallback
     */
    @CircuitBreaker(name = "authService", fallbackMethod = "getDisplayNameFallback")
    @Retry(name = "authService")
    public String getDisplayName(Long userId) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri("/api/users/{userId}", userId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block();

            if (response != null) {
                // Try displayName, then username, then fallback
                String displayName = (String) response.get("displayName");
                if (displayName != null && !displayName.isBlank()) {
                    return displayName;
                }
                String username = (String) response.get("username");
                if (username != null && !username.isBlank()) {
                    return username;
                }
            }
            return "User " + userId;

        } catch (Exception e) {
            log.debug("Failed to get display name for user {}: {}", userId, e.getMessage());
            return "User " + userId;
        }
    }

    @SuppressWarnings("unused")
    private String getDisplayNameFallback(Long userId, Throwable t) {
        log.warn("Circuit breaker triggered for getDisplayName: {}", t.getMessage());
        return "User " + userId;
    }

    /**
     * Get full user profile.
     */
    @CircuitBreaker(name = "authService", fallbackMethod = "getUserProfileFallback")
    @Retry(name = "authService")
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

    @SuppressWarnings("unused")
    private Map<String, Object> getUserProfileFallback(Long userId, Throwable t) {
        return null;
    }

    /**
     * Get user by ID (Reactive Mono version).
     * Used by PostService enrichment.
     */
    @CircuitBreaker(name = "authService", fallbackMethod = "getUserByIdFallback")
    @Retry(name = "authService")
    public reactor.core.publisher.Mono<UserDto> getUserById(Long userId) {
        return webClient.get()
                .uri("/api/users/{userId}", userId)
                .retrieve()
                .bodyToMono(UserDto.class)
                .timeout(timeout)
                .onErrorResume(e -> {
                    log.debug("Reactive fetch failed for user {}: {}", userId, e.getMessage());
                    return reactor.core.publisher.Mono.empty();
                });
    }

    @SuppressWarnings("unused")
    private reactor.core.publisher.Mono<UserDto> getUserByIdFallback(Long userId, Throwable t) {
        return reactor.core.publisher.Mono.empty();
    }

    /**
     * Check if user exists.
     */
    @CircuitBreaker(name = "authService")
    public boolean userExists(Long userId) {
        return getUserProfile(userId) != null;
    }
}
