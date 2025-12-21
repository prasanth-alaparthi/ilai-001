package com.muse.notes.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * InternalServiceInterceptor - Secures internal APIs.
 * 
 * Validates:
 * 1. IP address is in allowed list
 * 2. X-Internal-Token header matches configured secret
 * 
 * Applied to: /api/internal/**
 */
@Component
@Slf4j
public class InternalServiceInterceptor implements HandlerInterceptor {

    @Value("${internal.service.ips:127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16}")
    private String allowedIpsConfig;

    @Value("${internal.service.token:CHANGE_ME_IN_PRODUCTION}")
    private String internalToken;

    private List<String> allowedIps;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        // Lazy initialization of allowed IPs
        if (allowedIps == null) {
            allowedIps = Arrays.asList(allowedIpsConfig.split(","));
        }

        String requestIp = getClientIp(request);
        String token = request.getHeader("X-Internal-Token");

        // IP validation
        if (!isIpAllowed(requestIp)) {
            log.warn("Unauthorized internal API call from IP: {}", requestIp);
            sendUnauthorizedResponse(response, "Unauthorized IP address");
            return false;
        }

        // Token validation
        if (token == null || !internalToken.equals(token)) {
            log.warn("Invalid internal token from IP: {}", requestIp);
            sendUnauthorizedResponse(response, "Invalid or missing internal service token");
            return false;
        }

        log.debug("Internal API call authorized from IP: {}", requestIp);
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        // Check for proxy headers first
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }

        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty()) {
            return ip;
        }

        return request.getRemoteAddr();
    }

    private boolean isIpAllowed(String ip) {
        // Exact match first
        if (allowedIps.contains(ip)) {
            return true;
        }

        // Check for CIDR ranges (simplified - checks if IP starts with network)
        for (String allowedIp : allowedIps) {
            if (allowedIp.contains("/")) {
                String network = allowedIp.split("/")[0];
                String[] networkParts = network.split("\\.");
                String[] ipParts = ip.split("\\.");

                if (networkParts.length >= 3 && ipParts.length >= 3) {
                    // Match first 3 octets for /24 networks
                    if (networkParts[0].equals(ipParts[0]) &&
                            networkParts[1].equals(ipParts[1]) &&
                            networkParts[2].equals(ipParts[2])) {
                        return true;
                    }
                }
            }
        }

        // Localhost special cases
        return ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1");
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\"error\":\"%s\",\"status\":403,\"timestamp\":\"%s\"}",
                message,
                java.time.Instant.now().toString()));
    }
}
