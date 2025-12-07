package com.muse.auth.auth.repository;

import com.muse.auth.auth.entity.VerificationToken;
import com.muse.auth.VerificationTokenType; // Corrected import
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
    Optional<VerificationToken> findByTokenAndType(String token, VerificationTokenType type);
}
