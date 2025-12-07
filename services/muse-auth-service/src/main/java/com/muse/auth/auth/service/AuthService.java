package com.muse.auth.auth.service;

import com.muse.auth.auth.enums.Role;
import com.muse.auth.security.CustomUserDetails;
import com.muse.auth.auth.entity.VerificationToken;
import com.muse.auth.auth.enums.AccountStatus;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.mail.MailService;
import com.muse.auth.auth.repository.UserRepository;
import com.muse.auth.auth.repository.InstitutionRepository;
import com.muse.auth.auth.dto.LoginRequest;
import com.muse.auth.auth.dto.RegistrationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenService tokenService;
    private final MailService mailService;
    private final InstitutionRepository institutionRepository;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.admin-registration-key}")
    private String adminRegistrationKey;

    @Value("${app.email.verification.enabled:true}")
    private boolean emailVerificationEnabled;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_SECONDS = 60 * 60;

    @Transactional
    public User register(RegistrationRequest req) {
        if (req == null)
            throw new IllegalArgumentException("Request is null");

        String username = req.getUsername().trim();
        String email = req.getEmail().trim().toLowerCase();
        String rawPassword = req.getPassword();

        if (username.isEmpty() || email.isEmpty() || rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Missing required registration fields");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Role-based Validation
        if (req.getRole() == Role.ADMIN || req.getRole() == Role.INSTITUTION_ADMIN) {
            if (req.getAdminKey() == null || !req.getAdminKey().equals(adminRegistrationKey)) {
                throw new IllegalArgumentException("Invalid Admin Secret Key");
            }
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .failedLoginAttempts(0)
                .emailVerified(false)
                .role(req.getRole())
                .dateOfBirth(req.getDateOfBirth())
                .gender(req.getGender())
                .build();

        // Set initial status based on role
        if (req.getRole() == Role.STUDENT) {
            if (emailVerificationEnabled) {
                user.setStatus(AccountStatus.PENDING_VERIFICATION); // Students need email verification
            } else {
                user.setStatus(AccountStatus.ACTIVE); // Auto-activate if verification disabled
                user.setEmailVerified(true);
            }
        } else if (req.getRole() == Role.TEACHER) {
            // Teachers are PENDING unless they provide a valid Institution Code (future
            // enhancement)
            // For now, if they have an institutionId, we treat it as a "request"
            if (req.getInstitutionId() != null && !req.getInstitutionId().isEmpty()) {
                // Logic to verify code could go here. For now, we default to
                // PENDING_VERIFICATION
                // or ACTIVE if we trust the code. Let's stick to the plan: Pending if no code.
                // Since we don't have a code validator yet, let's mark them
                // PENDING_VERIFICATION
                // which effectively means "Pending Approval" in our new flow.
                user.setStatus(AccountStatus.PENDING_VERIFICATION);
            } else {
                user.setStatus(AccountStatus.PENDING_VERIFICATION);
            }
        } else {
            user.setStatus(AccountStatus.ACTIVE); // Admins are active immediately (key verified)
            user.setEmailVerified(true); // Admins are trusted
        }

        return userRepository.save(user);
    }

    @Transactional
    public CustomUserDetails authenticate(LoginRequest req) {
        String loginIdentifier = req.getUsername();
        if (loginIdentifier == null || loginIdentifier.isBlank()) {
            loginIdentifier = req.getIdentifier();
        }

        if (loginIdentifier == null || loginIdentifier.isBlank()) {
            throw new BadCredentialsException("Username or identifier must be provided");
        }

        loginIdentifier = loginIdentifier.trim();
        if (loginIdentifier.contains("@")) {
            loginIdentifier = loginIdentifier.toLowerCase();
        }
        String rawPassword = req.getPassword();

        if (rawPassword == null) {
            throw new BadCredentialsException("Invalid username or password");
        }

        Optional<User> userOpt = userRepository.findByUsernameOrEmail(loginIdentifier, loginIdentifier);
        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("Invalid username or password");
        }
        User user = userOpt.get();

        if (user.getLockedUntil() != null && Instant.now().isBefore(user.getLockedUntil())) {
            throw new LockedException("Account locked due to failed attempts");
        }

        if (user.getStatus() == AccountStatus.BLOCKED) {
            throw new DisabledException("Account blocked");
        }

        // Check for email verification status
        if (emailVerificationEnabled && !user.isEmailVerified()) {
            logger.info("User {} attempted login with unverified email. Resending verification link.",
                    user.getUsername());
            // Resend verification email
            sendEmailVerificationForUser(user);
            throw new EmailNotVerifiedException(
                    "Email not verified. A new verification link has been sent to " + user.getEmail());
        }

        try {
            UsernamePasswordAuthenticationToken authReq = new UsernamePasswordAuthenticationToken(user.getUsername(),
                    rawPassword);
            authenticationManager.authenticate(authReq);

            resetFailedAttempts(user);
        } catch (BadCredentialsException ex) {
            incrementFailedAttempts(user);
            throw ex;
        }

        return new CustomUserDetails(user);
    }

    private void incrementFailedAttempts(User user) {
        int attempts = user.getFailedLoginAttempts();
        attempts++;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setStatus(AccountStatus.BLOCKED);
            user.setLockedUntil(Instant.now().plusSeconds(LOCK_TIME_SECONDS));
        }
        userRepository.save(user);
    }

    private void resetFailedAttempts(User user) {
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        if (user.getStatus() == AccountStatus.BLOCKED) {
            user.setStatus(AccountStatus.ACTIVE);
        }
        userRepository.save(user);
    }

    @Transactional // Reverted to default @Transactional
    public void sendEmailVerificationForUser(User user) {
        if (!emailVerificationEnabled) {
            logger.info("Email verification disabled. Skipping email for user: {}", user.getEmail());
            return;
        }
        logger.info("AuthService: Generating and sending email verification link for user: {}", user.getEmail());
        VerificationToken token = tokenService.createEmailVerificationToken(user, 86400);
        String link = frontendBaseUrl + "/verify-email?token=" + token.getToken();
        mailService.sendVerificationEmail(user.getEmail(), link);
    }

    @Transactional
    public void sendPasswordResetLink(String emailOrUsername) {
        User user = userRepository.findByUsernameOrEmail(emailOrUsername, emailOrUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        VerificationToken token = tokenService.createPasswordResetToken(user, 3600);
        String link = frontendBaseUrl + "/reset-password?token=" + token.getToken();
        mailService.sendPasswordReset(user.getEmail(), link);
    }

    @Transactional
    public void verifyEmailByToken(String tokenValue) {
        tokenService.verifyEmail(tokenValue);
    }

    @Transactional
    public void resetPasswordByToken(String tokenValue, String newPasswordRaw) {
        String hash = passwordEncoder.encode(newPasswordRaw);
        tokenService.resetPassword(tokenValue, hash);
    }

    @Transactional
    public void requestInstitutionVerification(String username, Long institutionId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Only students can request institution verification");
        }

        com.muse.auth.auth.entity.Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new IllegalArgumentException("Institution not found"));

        user.setInstitution(institution);
        user.setVerificationStatus(com.muse.auth.auth.enums.VerificationStatus.PENDING);
        userRepository.save(user);
    }

    @Transactional
    public User approveStudentInstitutionVerification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Only student accounts require institution verification.");
        }
        // Allow approval if pending or even if none (admin override)

        user.setVerificationStatus(com.muse.auth.auth.enums.VerificationStatus.VERIFIED);
        // Status is already ACTIVE usually, but ensure it
        if (user.getStatus() != AccountStatus.ACTIVE) {
            user.setStatus(AccountStatus.ACTIVE);
        }
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setRole(newRole);

        // If promoting to Teacher/Admin, ensure they are ACTIVE
        if (newRole == Role.TEACHER || newRole == Role.ADMIN || newRole == Role.INSTITUTION_ADMIN) {
            if (user.getStatus() == AccountStatus.PENDING_VERIFICATION) {
                user.setStatus(AccountStatus.ACTIVE);
                user.setVerificationStatus(com.muse.auth.auth.enums.VerificationStatus.VERIFIED);
            }
        }

        return userRepository.save(user);
    }
}
