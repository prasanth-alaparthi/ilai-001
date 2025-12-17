package com.muse.ai.service;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import io.github.resilience4j.reactor.ratelimiter.operator.RateLimiterOperator;
import io.github.resilience4j.reactor.retry.RetryOperator;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.function.Function;

/**
 * Resilient Service Client - Phase 2 Error Handling
 * Wraps all inter-service calls with circuit breaker, retry, and rate limiting
 */
@Service
@Slf4j
public class ResilientServiceClient {

    private final WebClient webClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final RetryRegistry retryRegistry;
    private final RateLimiterRegistry rateLimiterRegistry;

    @Value("${muse.notes-service.url:http://muse-notes-service:8082}")
    private String notesServiceUrl;

    @Value("${muse.feed-service.url:http://muse-feed-service:8083}")
    private String feedServiceUrl;

    @Value("${muse.chat-service.url:http://muse-chat-service:8086}")
    private String chatServiceUrl;

    @Value("${muse.auth-service.url:http://muse-auth-service:8081}")
    private String authServiceUrl;

    @Value("${muse.classroom-service.url:http://muse-classroom-service:8090}")
    private String classroomServiceUrl;

    public ResilientServiceClient(
            WebClient.Builder webClientBuilder,
            CircuitBreakerRegistry circuitBreakerRegistry,
            RetryRegistry retryRegistry,
            RateLimiterRegistry rateLimiterRegistry) {
        this.webClient = webClientBuilder
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.circuitBreakerRegistry = circuitBreakerRegistry;
        this.retryRegistry = retryRegistry;
        this.rateLimiterRegistry = rateLimiterRegistry;
    }

    // ============== Notes Service Calls ==============

    public Mono<Object> searchNotes(String query, Long userId, int limit) {
        return callService(
                "notes-service",
                notesServiceUrl + "/api/notes/search?q=" + query + "&limit=" + limit,
                userId,
                Object.class);
    }

    public Mono<Object> getNote(Long noteId, Long userId) {
        return callService(
                "notes-service",
                notesServiceUrl + "/api/notes/" + noteId,
                userId,
                Object.class);
    }

    public Mono<Object> getNoteBacklinks(Long noteId, Long userId) {
        return callService(
                "notes-service",
                notesServiceUrl + "/api/notes/" + noteId + "/backlinks",
                userId,
                Object.class);
    }

    public Mono<Object> createNote(Map<String, Object> noteData, Long userId) {
        return postService(
                "notes-service",
                notesServiceUrl + "/api/notes",
                noteData,
                userId,
                Object.class);
    }

    // ============== Feed Service Calls ==============

    public Mono<Object> searchFeed(String query, Long userId) {
        return callService(
                "feed-service",
                feedServiceUrl + "/api/feed/search?q=" + query,
                userId,
                Object.class);
    }

    public Mono<Object> getFeedRecommendations(Long userId) {
        return callService(
                "feed-service",
                feedServiceUrl + "/api/feed/recommended",
                userId,
                Object.class);
    }

    public Mono<Object> getArticle(Long articleId, Long userId) {
        return callService(
                "feed-service",
                feedServiceUrl + "/api/feed/articles/" + articleId,
                userId,
                Object.class);
    }

    // ============== Chat Service Calls ==============

    public Mono<Object> searchChat(String query, Long userId) {
        return callService(
                "chat-service",
                chatServiceUrl + "/api/messages/search?q=" + query,
                userId,
                Object.class);
    }

    public Mono<Object> getConversation(Long conversationId, Long userId) {
        return callService(
                "chat-service",
                chatServiceUrl + "/api/conversations/" + conversationId,
                userId,
                Object.class);
    }

    // ============== Classroom Service Calls ==============

    public Mono<Object> getClassroomCourses(Long userId) {
        return callService(
                "classroom-service",
                classroomServiceUrl + "/api/courses",
                userId,
                Object.class);
    }

    public Mono<Object> getCourse(Long courseId, Long userId) {
        return callService(
                "classroom-service",
                classroomServiceUrl + "/api/courses/" + courseId,
                userId,
                Object.class);
    }

    // ============== Generic Service Call Methods ==============

    /**
     * GET request with full resilience (circuit breaker + retry + rate limiter)
     */
    public <T> Mono<T> callService(String serviceName, String url, Long userId, Class<T> responseType) {
        CircuitBreaker circuitBreaker = getOrCreateCircuitBreaker(serviceName);
        Retry retry = getOrCreateRetry(serviceName);
        RateLimiter rateLimiter = getOrCreateRateLimiter(serviceName);

        log.debug("Calling {} with resilience: {}", serviceName, url);

        return webClient.get()
                .uri(url)
                .header("X-User-Id", String.valueOf(userId))
                .retrieve()
                .bodyToMono(responseType)
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .transformDeferred(RetryOperator.of(retry))
                .transformDeferred(RateLimiterOperator.of(rateLimiter))
                .timeout(Duration.ofSeconds(10))
                .doOnSuccess(result -> log.debug("{} call succeeded", serviceName))
                .doOnError(error -> log.warn("{} call failed: {}", serviceName, error.getMessage()))
                .onErrorResume(handleError(serviceName, url));
    }

    /**
     * POST request with full resilience
     */
    public <T> Mono<T> postService(String serviceName, String url, Object body, Long userId, Class<T> responseType) {
        CircuitBreaker circuitBreaker = getOrCreateCircuitBreaker(serviceName);
        Retry retry = getOrCreateRetry(serviceName);
        RateLimiter rateLimiter = getOrCreateRateLimiter(serviceName);

        log.debug("POST to {} with resilience: {}", serviceName, url);

        return webClient.post()
                .uri(url)
                .header("X-User-Id", String.valueOf(userId))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(responseType)
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .transformDeferred(RetryOperator.of(retry))
                .transformDeferred(RateLimiterOperator.of(rateLimiter))
                .timeout(Duration.ofSeconds(10))
                .doOnSuccess(result -> log.debug("{} POST succeeded", serviceName))
                .doOnError(error -> log.warn("{} POST failed: {}", serviceName, error.getMessage()))
                .onErrorResume(handleError(serviceName, url));
    }

    /**
     * PUT request with full resilience
     */
    public <T> Mono<T> putService(String serviceName, String url, Object body, Long userId, Class<T> responseType) {
        CircuitBreaker circuitBreaker = getOrCreateCircuitBreaker(serviceName);
        Retry retry = getOrCreateRetry(serviceName);

        return webClient.put()
                .uri(url)
                .header("X-User-Id", String.valueOf(userId))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(responseType)
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .transformDeferred(RetryOperator.of(retry))
                .timeout(Duration.ofSeconds(10))
                .onErrorResume(handleError(serviceName, url));
    }

    /**
     * DELETE request with full resilience
     */
    public <T> Mono<T> deleteService(String serviceName, String url, Long userId, Class<T> responseType) {
        CircuitBreaker circuitBreaker = getOrCreateCircuitBreaker(serviceName);
        Retry retry = getOrCreateRetry(serviceName);

        return webClient.delete()
                .uri(url)
                .header("X-User-Id", String.valueOf(userId))
                .retrieve()
                .bodyToMono(responseType)
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .transformDeferred(RetryOperator.of(retry))
                .timeout(Duration.ofSeconds(10))
                .onErrorResume(handleError(serviceName, url));
    }

    // ============== Helper Methods ==============

    private CircuitBreaker getOrCreateCircuitBreaker(String serviceName) {
        return circuitBreakerRegistry.circuitBreaker(serviceName);
    }

    private Retry getOrCreateRetry(String serviceName) {
        return retryRegistry.retry(serviceName);
    }

    private RateLimiter getOrCreateRateLimiter(String serviceName) {
        return rateLimiterRegistry.rateLimiter(serviceName);
    }

    /**
     * Error handler that provides fallback values
     */
    private <T> Function<Throwable, Mono<T>> handleError(String serviceName, String url) {
        return error -> {
            log.error("Service {} call to {} failed after retries: {}", serviceName, url, error.getMessage());

            if (error instanceof WebClientResponseException.NotFound) {
                log.debug("Resource not found: {}", url);
                return Mono.empty();
            }

            if (error instanceof WebClientResponseException.Unauthorized) {
                log.warn("Unauthorized access to: {}", url);
                return Mono.error(new SecurityException("Unauthorized access"));
            }

            if (error instanceof io.github.resilience4j.circuitbreaker.CallNotPermittedException) {
                log.warn("Circuit breaker open for {}", serviceName);
                return Mono.error(new ServiceUnavailableException(serviceName + " is temporarily unavailable"));
            }

            if (error instanceof io.github.resilience4j.ratelimiter.RequestNotPermitted) {
                log.warn("Rate limit exceeded for {}", serviceName);
                return Mono.error(new RateLimitExceededException("Too many requests to " + serviceName));
            }

            // Generic error
            return Mono.error(new ServiceCallException(serviceName, error.getMessage()));
        };
    }

    // ============== Custom Exceptions ==============

    public static class ServiceUnavailableException extends RuntimeException {
        public ServiceUnavailableException(String message) {
            super(message);
        }
    }

    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }

    public static class ServiceCallException extends RuntimeException {
        private final String serviceName;

        public ServiceCallException(String serviceName, String message) {
            super("Error calling " + serviceName + ": " + message);
            this.serviceName = serviceName;
        }

        public String getServiceName() {
            return serviceName;
        }
    }
}
