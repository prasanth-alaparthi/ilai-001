package com.muse.ai.config;

import com.muse.ai.exception.FeatureNotAvailableException;
import com.muse.ai.service.ResilientServiceClient.RateLimitExceededException;
import com.muse.ai.service.ResilientServiceClient.ServiceCallException;
import com.muse.ai.service.ResilientServiceClient.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Instant;
import java.util.Map;

/**
 * Global Exception Handler - Phase 2 Error Handling
 * Provides consistent error responses across all API endpoints
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        // ============== Resilience4j Exceptions ==============

        @ExceptionHandler(CallNotPermittedException.class)
        public ResponseEntity<Map<String, Object>> handleCircuitBreakerOpen(CallNotPermittedException ex) {
                log.warn("Circuit breaker is OPEN: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body(errorResponse(
                                                "SERVICE_UNAVAILABLE",
                                                "This service is temporarily unavailable. Please try again in a few moments.",
                                                503));
        }

        @ExceptionHandler(RequestNotPermitted.class)
        public ResponseEntity<Map<String, Object>> handleRateLimitExceeded(RequestNotPermitted ex) {
                log.warn("Rate limit exceeded: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(errorResponse(
                                                "RATE_LIMIT_EXCEEDED",
                                                "Too many requests. Please slow down and try again.",
                                                429));
        }

        @ExceptionHandler(RateLimitExceededException.class)
        public ResponseEntity<Map<String, Object>> handleCustomRateLimitExceeded(RateLimitExceededException ex) {
                log.warn("Custom rate limit exceeded: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(errorResponse(
                                                "RATE_LIMIT_EXCEEDED",
                                                ex.getMessage(),
                                                429));
        }

        @ExceptionHandler(ServiceUnavailableException.class)
        public ResponseEntity<Map<String, Object>> handleServiceUnavailable(ServiceUnavailableException ex) {
                log.error("Service unavailable: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body(errorResponse(
                                                "SERVICE_UNAVAILABLE",
                                                ex.getMessage(),
                                                503));
        }

        @ExceptionHandler(ServiceCallException.class)
        public ResponseEntity<Map<String, Object>> handleServiceCallException(ServiceCallException ex) {
                log.error("Service call failed: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.BAD_GATEWAY)
                                .body(errorResponse(
                                                "SERVICE_CALL_FAILED",
                                                ex.getMessage(),
                                                502));
        }

        // ============== WebClient Exceptions ==============

        @ExceptionHandler(WebClientResponseException.NotFound.class)
        public ResponseEntity<Map<String, Object>> handleNotFound(WebClientResponseException.NotFound ex) {
                log.debug("Resource not found: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(errorResponse(
                                                "NOT_FOUND",
                                                "The requested resource was not found.",
                                                404));
        }

        @ExceptionHandler(WebClientResponseException.Unauthorized.class)
        public ResponseEntity<Map<String, Object>> handleUnauthorized(WebClientResponseException.Unauthorized ex) {
                log.warn("Unauthorized access: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(errorResponse(
                                                "UNAUTHORIZED",
                                                "Authentication required.",
                                                401));
        }

        @ExceptionHandler(WebClientResponseException.Forbidden.class)
        public ResponseEntity<Map<String, Object>> handleForbidden(WebClientResponseException.Forbidden ex) {
                log.warn("Forbidden access: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(errorResponse(
                                                "FORBIDDEN",
                                                "You do not have permission to access this resource.",
                                                403));
        }

        @ExceptionHandler(WebClientResponseException.BadRequest.class)
        public ResponseEntity<Map<String, Object>> handleBadRequest(WebClientResponseException.BadRequest ex) {
                log.debug("Bad request: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errorResponse(
                                                "BAD_REQUEST",
                                                "Invalid request. Please check your input.",
                                                400));
        }

        @ExceptionHandler(WebClientResponseException.class)
        public ResponseEntity<Map<String, Object>> handleWebClientException(WebClientResponseException ex) {
                log.error("WebClient error: {} - {}", ex.getStatusCode(), ex.getMessage());
                return ResponseEntity
                                .status(ex.getStatusCode())
                                .body(errorResponse(
                                                "EXTERNAL_SERVICE_ERROR",
                                                "An error occurred while communicating with an external service.",
                                                ex.getStatusCode().value()));
        }

        // ============== Validation Exceptions ==============

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
                log.debug("Invalid argument: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errorResponse(
                                                "INVALID_ARGUMENT",
                                                ex.getMessage(),
                                                400));
        }

        @ExceptionHandler(SecurityException.class)
        public ResponseEntity<Map<String, Object>> handleSecurityException(SecurityException ex) {
                log.warn("Security exception: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(errorResponse(
                                                "SECURITY_ERROR",
                                                ex.getMessage(),
                                                403));
        }

        // ============== Feature Access Exceptions ==============

        @ExceptionHandler(FeatureNotAvailableException.class)
        public ResponseEntity<Map<String, Object>> handleFeatureNotAvailable(FeatureNotAvailableException ex) {
                log.info("Feature access denied: {} - requires {}", ex.getFeature(), ex.getRequiredTier());
                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(Map.of(
                                                "error", Map.of(
                                                                "code", "FEATURE_NOT_AVAILABLE",
                                                                "message", ex.getMessage(),
                                                                "status", 403),
                                                "feature", ex.getFeature(),
                                                "requiredTier", ex.getRequiredTier(),
                                                "upgradeRequired", true,
                                                "timestamp", Instant.now().toString(),
                                                "success", false));
        }

        // ============== Generic Fallback ==============

        @ExceptionHandler(Exception.class)
        public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
                log.error("Unhandled exception: ", ex);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(errorResponse(
                                                "INTERNAL_ERROR",
                                                "An unexpected error occurred. Please try again later.",
                                                500));
        }

        // ============== Helper Methods ==============

        private Map<String, Object> errorResponse(String code, String message, int status) {
                return Map.of(
                                "error", Map.of(
                                                "code", code,
                                                "message", message,
                                                "status", status),
                                "timestamp", Instant.now().toString(),
                                "success", false);
        }
}
