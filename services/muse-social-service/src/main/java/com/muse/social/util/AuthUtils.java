package com.muse.social.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

public class AuthUtils {

    private AuthUtils() {}

    public static Long getUserIdFromAuthentication(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            Object userIdClaim = jwt.getClaim("userId");
            if (userIdClaim instanceof Integer) {
                return ((Integer) userIdClaim).longValue();
            } else if (userIdClaim instanceof Long) {
                return (Long) userIdClaim;
            } else if (userIdClaim != null) {
                try {
                    return Long.valueOf(userIdClaim.toString());
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        return null;
    }

    public static String getAccessToken(Authentication auth) {
        if (auth == null || auth.getCredentials() == null) {
            return null;
        }
        // In Spring Security 5.x/6.x, the JWT token itself is often available as credentials
        if (auth.getCredentials() instanceof Jwt jwt) {
            return jwt.getTokenValue();
        }
        // Fallback if credentials is a String (e.g., from a custom filter)
        if (auth.getCredentials() instanceof String) {
            return (String) auth.getCredentials();
        }
        return null;
    }
}
