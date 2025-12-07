// --------------------
// File: com/muse/auth/util/AuthUtils.java
// Path: auth-service/src/main/java/com/muse/auth/util/AuthUtils.java
package com.muse.auth.util;

// import com.muse.auth.security.CustomUserDetails; // Moved to muse-auth-service
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Small helper for safely extracting username from Authentication across controllers/services.
 */
public final class AuthUtils {

    private AuthUtils() {}

    public static String username(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return null;
        Object p = auth.getPrincipal();
        // In a Resource Server, the principal will be a Jwt object
        if (p instanceof Jwt jwt) {
            return jwt.getSubject(); // Subject of the JWT is typically the username
        }
        // Fallback for other principal types if necessary (e.g., mock tests)
        if (p instanceof org.springframework.security.core.userdetails.User ud) {
            return ud.getUsername();
        }
        if (p instanceof String s) return s;
        return null;
    }
}
