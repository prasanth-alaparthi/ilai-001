package com.muse.notes.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

public class AuthUtils {

    private AuthUtils() {
        // Private constructor to prevent instantiation
    }

    public static Long getUserIdFromAuthentication(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            // Extract userId from the "userId" claim
            Object userIdClaim = jwt.getClaim("userId");
            if (userIdClaim instanceof Integer) { // JWT claims often come as Integer if they fit
                return ((Integer) userIdClaim).longValue();
            } else if (userIdClaim instanceof Long) {
                return (Long) userIdClaim;
            } else if (userIdClaim != null) {
                // Try to parse if it's a String representation of a Long
                try {
                    return Long.valueOf(userIdClaim.toString());
                } catch (NumberFormatException e) {
                    // Log error or handle appropriately
                    return null;
                }
            }
            // Fallback: if userId claim is not present, but subject is the ID
            // This is less ideal as subject is usually username, but kept for flexibility
            try {
                return Long.valueOf(jwt.getSubject());
            } catch (NumberFormatException e) {
                // Subject is not a number, so it's likely a username. Cannot use as ID directly.
                return null;
            }
        }
        // Fallback for other principal types if necessary (e.g., mock tests or different auth mechanisms)
        // For a resource server, principal should ideally always be a Jwt
        return null;
    }
}
