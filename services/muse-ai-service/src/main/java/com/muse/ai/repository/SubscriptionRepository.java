package com.muse.ai.repository;

import com.muse.ai.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByUserId(Long userId);

    Optional<Subscription> findByUserIdAndStatus(Long userId, String status);

    List<Subscription> findByStatusAndCurrentPeriodEndBefore(String status, LocalDateTime before);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'active' AND s.plan != 'free'")
    List<Subscription> findAllActivePaid();

    @Query("SELECT s FROM Subscription s WHERE s.userId = :userId AND s.status = 'ACTIVE'")
    Optional<Subscription> findActiveByUserId(Long userId);

    Optional<Subscription> findByExternalSubscriptionId(String externalSubscriptionId);

    boolean existsByUserId(Long userId);
}
