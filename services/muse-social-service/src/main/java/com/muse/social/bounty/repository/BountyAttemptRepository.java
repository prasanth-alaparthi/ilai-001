package com.muse.social.bounty.repository;

import com.muse.social.bounty.entity.BountyAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BountyAttemptRepository extends JpaRepository<BountyAttempt, Long> {

    List<BountyAttempt> findByBountyIdOrderByCreatedAtDesc(Long bountyId);

    List<BountyAttempt> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByBountyId(Long bountyId);

    long countByUserId(Long userId);

    boolean existsByBountyIdAndUserId(Long bountyId, Long userId);
}
