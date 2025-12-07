package com.muse.parental.service;

import com.muse.parental.entity.ParentalLock;
import com.muse.parental.repository.ParentalLockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ParentalLockService {

    private final ParentalLockRepository repo;

    @Transactional
    public void setupPin(Long userId, String plainPin) {
        String salt = BCrypt.gensalt(12);
        String hashed = BCrypt.hashpw(plainPin, salt);
        ParentalLock pl = repo.findByUserId(userId).orElseGet(() -> ParentalLock.builder().userId(userId).build());
        pl.setPinHash(hashed);
        pl.setEnabled(true);
        pl.setUpdatedAt(Instant.now());
        if (pl.getCreatedAt() == null)
            pl.setCreatedAt(Instant.now());
        repo.save(pl);
    }

    public boolean verifyPin(Long userId, String plainPin) {
        Optional<ParentalLock> opt = repo.findByUserId(userId);
        if (opt.isEmpty())
            return false;
        ParentalLock pl = opt.get();
        return BCrypt.checkpw(plainPin, pl.getPinHash());
    }

    public boolean isEnabled(Long userId) {
        return repo.findByUserId(userId).map(ParentalLock::getEnabled).orElse(false);
    }

    @Transactional
    public void removePin(Long userId) {
        repo.deleteByUserId(userId);
    }
}
