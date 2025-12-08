package com.muse.notes.journal.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

public class AuthUtils {
    public static Long getUserIdFromAuthentication(Authentication auth) {
        if (auth == null)
            return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            // Try to get userId from claim
            Object userIdClaim = jwt.getClaims().get("userId");
            if (userIdClaim instanceof Long) {
                return (Long) userIdClaim;
            } else if (userIdClaim instanceof Integer) {
                return ((Integer) userIdClaim).longValue();
            } else if (userIdClaim instanceof String) {
                try {
                    return Long.parseLong((String) userIdClaim);
                } catch (NumberFormatException e) {
                    // ignore
                }
            }

            // Fallback: try subject if it's a number
            String subject = jwt.getSubject();
            try {
                return Long.parseLong(subject);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
