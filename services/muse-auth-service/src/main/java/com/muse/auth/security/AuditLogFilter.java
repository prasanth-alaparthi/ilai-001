package com.muse.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

/**
 * Audit logging filter for security events.
 * Logs all authentication-related requests for security auditing.
 * Output format is structured for CloudWatch/ELK ingestion.
 */
@Component
public class AuditLogFilter extends OncePerRequestFilter {

    private static final Logger auditLog = LoggerFactory.getLogger("AUDIT");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestId = java.util.UUID.randomUUID().toString().substring(0, 8);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logAuditEvent(request, response, requestId, duration);
        }
    }

    private void logAuditEvent(HttpServletRequest request, HttpServletResponse response,
            String requestId, long duration) {
        String uri = request.getRequestURI();

        // Only log security-relevant endpoints
        if (!isSecurityEndpoint(uri)) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())
                ? auth.getName()
                : "anonymous";

        String eventType = determineEventType(uri, request.getMethod());
        int statusCode = response.getStatus();
        String outcome = statusCode >= 200 && statusCode < 300 ? "SUCCESS" : "FAILURE";

        // Structured audit log entry
        auditLog.info("AUDIT|{}|{}|{}|{}|{}|{}|{}|{}|{}ms",
                Instant.now().toString(),
                requestId,
                eventType,
                outcome,
                username,
                request.getMethod(),
                uri,
                getClientIp(request),
                duration);
    }

    private boolean isSecurityEndpoint(String uri) {
        return uri.startsWith("/api/auth/") ||
                uri.startsWith("/oauth2/") ||
                uri.startsWith("/login/") ||
                uri.contains("/token") ||
                uri.contains("/refresh");
    }

    private String determineEventType(String uri, String method) {
        if (uri.contains("/login") || uri.contains("/authenticate")) {
            return "LOGIN_ATTEMPT";
        } else if (uri.contains("/logout")) {
            return "LOGOUT";
        } else if (uri.contains("/register")) {
            return "REGISTRATION";
        } else if (uri.contains("/refresh")) {
            return "TOKEN_REFRESH";
        } else if (uri.contains("/forgot-password")) {
            return "PASSWORD_RESET_REQUEST";
        } else if (uri.contains("/reset-password")) {
            return "PASSWORD_RESET";
        } else if (uri.contains("/verify-email")) {
            return "EMAIL_VERIFICATION";
        } else if (uri.contains("/oauth2")) {
            return "OAUTH2_LOGIN";
        } else {
            return "AUTH_REQUEST";
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
