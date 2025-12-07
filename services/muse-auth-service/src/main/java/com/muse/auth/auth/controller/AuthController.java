package com.muse.auth.auth.controller;

import com.muse.auth.auth.dto.LoginRequest;
import com.muse.auth.auth.dto.MeResponse;
import com.muse.auth.auth.dto.RegistrationRequest;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.service.AuthService;
import com.muse.auth.auth.service.EmailNotVerifiedException;
import com.muse.auth.auth.service.JwtTokenService;
import com.muse.auth.auth.service.RefreshTokenService;
import com.muse.auth.security.CustomUserDetails;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtTokenService jwtTokenService;
    private final RefreshTokenService refreshTokenService;

    // --- LOGIN ENDPOINT ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        return performLogin(loginRequest, response);
    }

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        return performLogin(loginRequest, response);
    }

    private ResponseEntity<?> performLogin(LoginRequest loginRequest, HttpServletResponse response) {
        try {
            CustomUserDetails userDetails = authService.authenticate(loginRequest);
            String username = userDetails.getUsername();
            String role = userDetails.getUser().getRole().name();

            String accessToken = jwtTokenService.generateAccessToken(username, Map.of(
                    "userId", userDetails.getUser().getId(),
                    "role", role,
                    "subscriptionPlan",
                    userDetails.getUser().getSubscriptionPlan() != null
                            ? userDetails.getUser().getSubscriptionPlan().name()
                            : "FREE",
                    "isStudentVerified", userDetails.getUser().isStudentVerified()));
            String refreshToken = jwtTokenService.generateRefreshToken(username, Map.of(
                    "userId", userDetails.getUser().getId(),
                    "role", role,
                    "subscriptionPlan",
                    userDetails.getUser().getSubscriptionPlan() != null
                            ? userDetails.getUser().getSubscriptionPlan().name()
                            : "FREE",
                    "isStudentVerified", userDetails.getUser().isStudentVerified()));

            refreshTokenService.storeToken(username, refreshToken, jwtTokenService.getRefreshTtlSeconds());

            ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", accessToken)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(jwtTokenService.getAccessTtlSeconds())
                    .sameSite("Lax")
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("REFRESH_TOKEN", refreshToken)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(jwtTokenService.getRefreshTtlSeconds())
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            logger.info("User {} logged in successfully. AccessToken issued.", username);

            return ResponseEntity.ok()
                    .body(Map.of("accessToken", accessToken));
        } catch (EmailNotVerifiedException ex) {
            logger.warn("Login failed for {}: Email not verified. Resent verification link.",
                    loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", ex.getMessage(), "code", "EMAIL_NOT_VERIFIED"));
        } catch (BadCredentialsException ex) {
            logger.warn("Login failed for {}: Invalid credentials.", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password."));
        } catch (Exception ex) {
            logger.error("An unexpected error occurred during login for {}: {}", loginRequest.getUsername(),
                    ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred during login."));
        }
    }

    // --- REGISTRATION ENDPOINT ---
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest registrationRequest) {
        logger.info("Received registration request for username: {}", registrationRequest.getUsername());
        try {
            User newUser = authService.register(registrationRequest);
            authService.sendEmailVerificationForUser(newUser);
            logger.info("User {} registered successfully.", newUser.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "User registered successfully. Please check your email for verification."));
        } catch (IllegalArgumentException e) {
            logger.warn("Registration failed for {}: {}", registrationRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Registration failed: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("An unexpected error occurred during registration for {}: {}",
                    registrationRequest.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred during registration."));
        }
    }

    // --- OTHER AUTH ENDPOINTS ---
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUserDetails cud) {
        if (cud == null) {
            logger.warn("Unauthorized access attempt to /me endpoint.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Not authenticated"));
        }
        User user = cud.getUser();
        logger.info("User {} accessed /me endpoint.", user.getUsername());
        MeResponse me = MeResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .institutionId(user.getInstitution() != null ? user.getInstitution().getId() : null)
                .institutionName(user.getInstitution() != null ? user.getInstitution().getName() : null)
                .verificationStatus(user.getVerificationStatus())
                .gradeLevel(user.getGradeLevel())
                .subscriptionPlan(user.getSubscriptionPlan() != null ? user.getSubscriptionPlan().name() : "FREE")
                .isStudentVerified(user.isStudentVerified())
                .build();
        return ResponseEntity.ok(me);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("REFRESH_TOKEN".equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        logger.debug("Refresh endpoint hit. Received refreshToken: {}",
                refreshToken != null ? "[PRESENT]" : "[MISSING]");
        if (refreshToken == null) {
            logger.warn("Refresh token missing from request.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No refresh token"));
        }

        if (!refreshTokenService.isValid(refreshToken)) {
            logger.warn("Invalid or expired refresh token provided.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired refresh token"));
        }

        try {
            Jws<Claims> jws = jwtTokenService.parseRefreshToken(refreshToken);
            String username = jws.getBody().getSubject();

            // Fetch fresh user details to ensure we have the latest info and userId
            User user = authService.getUserByUsername(username);

            // Revoke the old token FIRST
            refreshTokenService.revokeToken(refreshToken);
            logger.info("Old refresh token revoked for user: {}", username);

            Map<String, Object> newClaims = new java.util.HashMap<>();
            newClaims.put("userId", user.getId());
            newClaims.put("role", user.getRole().name());
            newClaims.put("subscriptionPlan",
                    user.getSubscriptionPlan() != null ? user.getSubscriptionPlan().name() : "FREE");
            newClaims.put("isStudentVerified", user.isStudentVerified());

            String newAccessToken = jwtTokenService.generateAccessToken(username, newClaims);
            String newRefreshToken = jwtTokenService.generateRefreshToken(username, newClaims);

            // Store the new token AFTER revoking the old one
            refreshTokenService.storeToken(username, newRefreshToken, jwtTokenService.getRefreshTtlSeconds());
            logger.info("New refresh token stored for user: {}", username);

            ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", newAccessToken)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(jwtTokenService.getAccessTtlSeconds())
                    .sameSite("Lax")
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("REFRESH_TOKEN", newRefreshToken)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(jwtTokenService.getRefreshTtlSeconds())
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            logger.info("Refresh successful for user: {}. New access token issued.", username);
            return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
        } catch (JwtException ex) {
            logger.warn("Invalid refresh token payload during refresh: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid refresh token payload"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("REFRESH_TOKEN".equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        if (refreshToken != null) {
            refreshTokenService.revokeToken(refreshToken);
            logger.info("Refresh token revoked during logout.");
        }

        ResponseCookie clearAccess = ResponseCookie.from("ACCESS_TOKEN", "")
                .httpOnly(true).path("/").maxAge(0).sameSite("None").build();

        ResponseCookie clearRefresh = ResponseCookie.from("REFRESH_TOKEN", "")
                .httpOnly(true).path("/").maxAge(0).sameSite("None").build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());

        logger.info("User logged out successfully.");
        return ResponseEntity.ok()
                .body(Map.of("status", "success"));
    }

    // --- PASSWORD RESET ENDPOINTS ---

    public record ForgotPasswordRequest(@NotBlank String identifier) {
    }

    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) String newPassword) {
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        try {
            authService.sendPasswordResetLink(req.identifier());
            logger.info("Password reset link sent for identifier: {}", req.identifier());
        } catch (Exception e) {
            logger.warn("Failed to send password reset link for identifier {}: {}", req.identifier(), e.getMessage());
        }
        return ResponseEntity.ok(Map.of("message",
                "If an account with that email or username exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        try {
            authService.resetPasswordByToken(req.token(), req.newPassword());
            logger.info("Password reset successfully for token: {}", req.token());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
        } catch (IllegalArgumentException ex) {
            logger.warn("Password reset failed for token {}: {}", req.token(), ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            authService.verifyEmailByToken(token);
            logger.info("Email verified successfully for token: {}", token);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Email verified successfully."));
        } catch (IllegalArgumentException ex) {
            logger.warn("Email verification failed for token {}: {}", token, ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", ex.getMessage()));
        }
    }

    public record VerificationRequest(Long institutionId) {
    }

    @PostMapping("/request-verification")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> requestVerification(@RequestBody VerificationRequest req,
            @AuthenticationPrincipal CustomUserDetails cud) {
        try {
            authService.requestInstitutionVerification(cud.getUsername(), req.institutionId());
            return ResponseEntity.ok(Map.of("status", "success", "message", "Verification requested successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // Admin Endpoints for User Management
    @GetMapping("/admin/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTITUTION_ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PutMapping("/admin/users/{userId}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTITUTION_ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId, @RequestParam("role") String roleName) {
        try {
            com.muse.auth.auth.enums.Role newRole = com.muse.auth.auth.enums.Role.valueOf(roleName);
            User user = authService.updateUserRole(userId, newRole);
            return ResponseEntity
                    .ok(Map.of("status", "success", "message", "User role updated successfully.", "user", user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", ex.getMessage()));
        }
    }

    @PostMapping("/admin/students/{userId}/approve-institution")
    @PreAuthorize("hasRole('INSTITUTION_ADMIN')")
    public ResponseEntity<?> approveStudentInstitution(@PathVariable Long userId) {
        logger.info("Attempting to approve institution verification for student user ID: {}", userId);
        try {
            User user = authService.approveStudentInstitutionVerification(userId);
            logger.info("Institution verification approved for student user {}.", user.getUsername());
            return ResponseEntity
                    .ok(Map.of("status", "success", "message", "Student institution verification approved."));
        } catch (IllegalArgumentException ex) {
            logger.warn("Institution verification failed for user {}: {}", userId, ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("An unexpected error occurred during institution verification for user {}: {}", userId,
                    ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "An unexpected error occurred."));
        }
    }
}
