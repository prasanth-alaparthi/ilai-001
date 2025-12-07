package com.muse.auth.auth.service;

import com.muse.auth.auth.enums.Role;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.enums.AccountStatus;
import com.muse.auth.auth.repository.UserRepository;
import com.muse.auth.auth.repository.VerificationTokenRepository;
import com.muse.auth.auth.entity.VerificationToken;
import com.muse.auth.VerificationTokenType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation; // Added import
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VerificationTokenService {

    private static final Logger logger = LoggerFactory.getLogger(VerificationTokenService.class);

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    private String generateRandomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW) // Modified annotation
    public VerificationToken createEmailVerificationToken(User user, long ttlSeconds) {
        String tokenValue = generateRandomToken();
        Instant now = Instant.now();

        VerificationToken token = VerificationToken.builder()
                .userId(user.getId())
                .token(tokenValue)
                .type(VerificationTokenType.EMAIL_VERIFY)
                .createdAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .used(false)
                .build();

        logger.debug("Attempting to save email verification token: {}", token);
        VerificationToken savedToken = tokenRepository.save(token);
        logger.debug("Successfully saved email verification token: {}", savedToken);
        return savedToken;
    }

    @Transactional
    public VerificationToken createPasswordResetToken(User user, long ttlSeconds) {
        String tokenValue = generateRandomToken();
        Instant now = Instant.now();

        VerificationToken token = VerificationToken.builder()
                .userId(user.getId())
                .token(tokenValue)
                .type(VerificationTokenType.PASSWORD_RESET)
                .createdAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .used(false)
                .build();

        logger.debug("Attempting to save password reset token: {}", token);
        VerificationToken savedToken = tokenRepository.save(token);
        logger.debug("Successfully saved password reset token: {}", savedToken);
        return savedToken;
    }

    @Transactional
    public User verifyEmail(String tokenValue) {
        logger.info("Attempting to verify email with token: {}", tokenValue);
        logger.debug("Searching for token {} with type {}", tokenValue, VerificationTokenType.EMAIL_VERIFY);

        Optional<VerificationToken> tokenOptional = tokenRepository
                .findByTokenAndType(tokenValue, VerificationTokenType.EMAIL_VERIFY);

        if (tokenOptional.isEmpty()) {
            logger.warn("Verification failed: Invalid verification token {}. Token not found in repository.",
                    tokenValue);
            throw new IllegalArgumentException("Invalid verification token");
        }

        VerificationToken token = tokenOptional.get();
        logger.debug("Found verification token: {}", token);

        if (token.isUsed()) {
            logger.warn("Verification failed: Token {} already used", tokenValue);
            throw new IllegalArgumentException("Verification token is already used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            logger.warn("Verification failed: Token {} expired", tokenValue);
            throw new IllegalArgumentException("Verification token is expired");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> {
                    logger.warn("Verification failed: User not found for token {}", tokenValue);
                    return new IllegalArgumentException("User not found");
                });

        user.setEmailVerified(true);
        if (user.getRole() == Role.STUDENT) {
            user.setStatus(AccountStatus.ACTIVE);
            // user.setVerificationStatus(VerificationStatus.NONE); // Already set on create
            logger.info("Student user {} email verified, status set to ACTIVE.", user.getUsername());
        } else if (user.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            user.setStatus(AccountStatus.ACTIVE);
            logger.info("User {} email verified, status set to ACTIVE.", user.getUsername());
        }

        token.setUsed(true);
        tokenRepository.save(token);
        logger.info("Email verified successfully for user {} with token {}", user.getUsername(), tokenValue);
        return userRepository.save(user);
    }

    @Transactional
    public User resetPassword(String tokenValue, String newPasswordHash) {
        logger.debug("Searching for password reset token: {}", tokenValue);
        Optional<VerificationToken> tokenOptional = tokenRepository
                .findByTokenAndType(tokenValue, VerificationTokenType.PASSWORD_RESET);

        if (tokenOptional.isEmpty()) {
            logger.warn("Password reset failed: Invalid password reset token {}. Token not found in repository.",
                    tokenValue);
            throw new IllegalArgumentException("Invalid password reset token");
        }

        VerificationToken token = tokenOptional.get();
        logger.debug("Found password reset token: {}", token);

        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset token is expired or already used");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPasswordHash(newPasswordHash);
        user.setLastPasswordChangeAt(Instant.now());

        token.setUsed(true);
        tokenRepository.save(token);
        return userRepository.save(user);
    }
}
