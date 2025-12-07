package com.muse.auth.auth.service;

import com.muse.auth.auth.entity.RefreshToken;
import com.muse.auth.auth.repository.RefreshTokenRepository;
import com.muse.auth.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException; // Import for handling duplicate key errors
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository repo;
    private final UserRepository userRepository;

    @Transactional
    public RefreshToken storeToken(String username, String token, long ttlSeconds) {
        Instant now = Instant.now();
        RefreshToken rt = RefreshToken.builder()
                .username(username)
                .token(token)
                .createdAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .revoked(false)
                .build();
        logger.info("Storing refresh token for user: {}", username);
        try {
            return repo.save(rt);
        } catch (DataIntegrityViolationException e) {
            logger.warn("Attempted to store duplicate refresh token for user {}. Retrieving existing token.", username);
            // If a duplicate key error occurs, it means the token already exists.
            // This can happen in race conditions. Retrieve the existing one.
            return repo.findByToken(token)
                       .orElseThrow(() -> new IllegalStateException("Duplicate token detected but not found after retry."));
        }
    }

    @Transactional
    public boolean revokeToken(String token) {
        return repo.findByToken(token).map(rt -> {
            rt.setRevoked(true); // Mark as revoked instead of deleting
            repo.save(rt);
            logger.info("Revoked single refresh token for user: {}", rt.getUsername());
            return true;
        }).orElseGet(() -> {
            logger.warn("Attempted to revoke non-existent refresh token.");
            return false;
        });
    }

    @Transactional
    public void revokeAllForUser(String username) {
        List<RefreshToken> tokens = repo.findByUsername(username);
        tokens.forEach(t -> t.setRevoked(true)); // Mark all as revoked
        repo.saveAll(tokens);
        logger.info("Revoked all refresh tokens for user: {}", username);
    }

    public boolean isValid(String token) {
        logger.debug("Validating refresh token: {}", token != null ? "[PRESENT]" : "[MISSING]");
        Optional<RefreshToken> tokenOptional = repo.findByToken(token);

        if (tokenOptional.isEmpty()) {
            logger.debug("Token not found in repository.");
            return false;
        }

        RefreshToken rt = tokenOptional.get();
        logger.debug("Found refresh token: {}", rt);

        if (rt.isRevoked()) {
            logger.debug("Token is revoked.");
            return false;
        }

        if (rt.getExpiresAt().isBefore(Instant.now())) {
            logger.debug("Token is expired. Expires at: {}", rt.getExpiresAt());
            return false;
        }

        logger.debug("Refresh token is valid.");
        return true;
    }

    @Transactional
    public void save(String token, String username, long expiryMs) {
        long ttlSeconds = (expiryMs > 1_000_000_000_000L) ? (expiryMs / 1000) : expiryMs;
        storeToken(username, token, ttlSeconds);
    }

    @Transactional
    public boolean validate(String token, String username) {
        return repo.findByToken(token)
                .filter(rt -> !rt.isRevoked() && rt.getExpiresAt().isAfter(Instant.now())
                        && rt.getUsername().equals(username))
                .isPresent();
    }

    @Transactional
    public void revoke(String token) {
        revokeToken(token);
    }
}
