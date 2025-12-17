package com.muse.ai.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeoutException;

/**
 * Resilience4j Configuration - Phase 2 Error Handling
 * Provides circuit breakers, retries, rate limiters for resilient service calls
 */
@Configuration
public class ResilienceConfig {

    // ============== Circuit Breaker Configuration ==============

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.of(defaultCircuitBreakerConfig());
    }

    @Bean
    public CircuitBreakerConfig defaultCircuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(10) // Last 10 calls
                .minimumNumberOfCalls(5) // Min calls before evaluating
                .failureRateThreshold(50) // Open if 50% fail
                .slowCallRateThreshold(80) // Open if 80% are slow
                .slowCallDurationThreshold(Duration.ofSeconds(3))
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(3)
                .automaticTransitionFromOpenToHalfOpenEnabled(true)
                .recordExceptions(
                        IOException.class,
                        TimeoutException.class,
                        WebClientResponseException.class)
                .ignoreExceptions(
                        IllegalArgumentException.class)
                .build();
    }

    // Named circuit breakers for different services
    @Bean
    public CircuitBreaker llmCircuitBreaker(CircuitBreakerRegistry registry) {
        return registry.circuitBreaker("llm", CircuitBreakerConfig.custom()
                .slidingWindowSize(5)
                .failureRateThreshold(60)
                .waitDurationInOpenState(Duration.ofSeconds(60)) // LLM needs longer recovery
                .slowCallDurationThreshold(Duration.ofSeconds(10)) // LLM calls can be slow
                .build());
    }

    @Bean
    public CircuitBreaker notesServiceCircuitBreaker(CircuitBreakerRegistry registry) {
        return registry.circuitBreaker("notes-service", defaultCircuitBreakerConfig());
    }

    @Bean
    public CircuitBreaker feedServiceCircuitBreaker(CircuitBreakerRegistry registry) {
        return registry.circuitBreaker("feed-service", defaultCircuitBreakerConfig());
    }

    // ============== Retry Configuration ==============

    @Bean
    public RetryRegistry retryRegistry() {
        return RetryRegistry.of(defaultRetryConfig());
    }

    @Bean
    public RetryConfig defaultRetryConfig() {
        return RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(500))
                .retryExceptions(
                        IOException.class,
                        TimeoutException.class,
                        WebClientResponseException.ServiceUnavailable.class,
                        WebClientResponseException.GatewayTimeout.class,
                        WebClientResponseException.TooManyRequests.class)
                .ignoreExceptions(
                        WebClientResponseException.NotFound.class,
                        WebClientResponseException.BadRequest.class,
                        WebClientResponseException.Unauthorized.class)
                .build();
    }

    @Bean
    public Retry llmRetry(RetryRegistry registry) {
        return registry.retry("llm", RetryConfig.custom()
                .maxAttempts(2) // LLM is expensive, limit retries
                .waitDuration(Duration.ofSeconds(2)) // Wait longer between retries
                .retryOnResult(response -> response == null) // Retry on null response
                .build());
    }

    @Bean
    public Retry serviceRetry(RetryRegistry registry) {
        return registry.retry("service", defaultRetryConfig());
    }

    // ============== Rate Limiter Configuration ==============

    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        return RateLimiterRegistry.of(defaultRateLimiterConfig());
    }

    @Bean
    public RateLimiterConfig defaultRateLimiterConfig() {
        return RateLimiterConfig.custom()
                .limitForPeriod(100) // 100 calls per period
                .limitRefreshPeriod(Duration.ofMinutes(1)) // Per minute
                .timeoutDuration(Duration.ofSeconds(5))
                .build();
    }

    @Bean
    public RateLimiter llmRateLimiter(RateLimiterRegistry registry) {
        return registry.rateLimiter("llm", RateLimiterConfig.custom()
                .limitForPeriod(30) // 30 LLM calls per minute
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .timeoutDuration(Duration.ofSeconds(10))
                .build());
    }

    @Bean
    public RateLimiter userRateLimiter(RateLimiterRegistry registry) {
        return registry.rateLimiter("user", RateLimiterConfig.custom()
                .limitForPeriod(60) // 60 requests per minute per user
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .timeoutDuration(Duration.ofSeconds(1))
                .build());
    }

    // ============== Time Limiter Configuration ==============

    @Bean
    public TimeLimiterRegistry timeLimiterRegistry() {
        return TimeLimiterRegistry.of(defaultTimeLimiterConfig());
    }

    @Bean
    public TimeLimiterConfig defaultTimeLimiterConfig() {
        return TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(10))
                .cancelRunningFuture(true)
                .build();
    }

    @Bean
    public TimeLimiter llmTimeLimiter(TimeLimiterRegistry registry) {
        return registry.timeLimiter("llm", TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(30)) // LLM can take up to 30s
                .cancelRunningFuture(true)
                .build());
    }
}
