package com.muse.parental.repository;

import com.muse.parental.entity.ParentalLock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParentalLockRepository extends JpaRepository<ParentalLock, Long> {
    Optional<ParentalLock> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
