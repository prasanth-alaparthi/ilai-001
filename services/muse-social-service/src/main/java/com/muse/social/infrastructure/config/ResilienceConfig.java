package com.muse.social.infrastructure.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Resilience4j Configuration for inter-service communication.
 * 
 * Protects NotesServiceClient and AuthServiceClient from:
 * - Service unavailability (Circuit Breaker)
 * - Transient failures (Retry)
 * - Slow responses (Time Limiter)
 */
@Configuration
public class ResilienceConfig {

    // ==================== CIRCUIT BREAKER ====================

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig notesServiceConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50) // Open when 50% fail
                .waitDurationInOpenState(Duration.ofSeconds(30)) // Stay open 30s
                .permittedNumberOfCallsInHalfOpenState(3) // Test with 3 calls
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(10) // Last 10 calls
                .minimumNumberOfCalls(5) // Need 5 calls minimum
                .build();

        CircuitBreakerConfig authServiceConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(20))
                .permittedNumberOfCallsInHalfOpenState(2)
                .slidingWindowSize(5)
                .minimumNumberOfCalls(3)
                .build();

        return CircuitBreakerRegistry.of(
                java.util.Map.of(
                        "notesService", notesServiceConfig,
                        "authService", authServiceConfig));
    }

    // ==================== RETRY ====================

    @Bean
    public RetryRegistry retryRegistry() {
        RetryConfig notesServiceConfig = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(500))
                .retryExceptions(
                        java.io.IOException.class,
                        java.util.concurrent.TimeoutException.class,
                        org.springframework.web.reactive.function.client.WebClientRequestException.class)
                .ignoreExceptions(
                        org.springframework.web.reactive.function.client.WebClientResponseException.NotFound.class,
                        org.springframework.web.reactive.function.client.WebClientResponseException.Unauthorized.class)
                .build();

        RetryConfig authServiceConfig = RetryConfig.custom()
                .maxAttempts(2)
                .waitDuration(Duration.ofMillis(300))
                .retryExceptions(java.io.IOException.class)
                .build();

        return RetryRegistry.of(
                java.util.Map.of(
                        "notesService", notesServiceConfig,
                        "authService", authServiceConfig));
    }

    // ==================== TIME LIMITER ====================

    @Bean
    public TimeLimiterRegistry timeLimiterRegistry() {
        TimeLimiterConfig config = TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(5))
                .cancelRunningFuture(true)
                .build();

        return TimeLimiterRegistry.of(config);
    }
}
