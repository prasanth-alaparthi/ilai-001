package com.muse.ai.repository;

import com.muse.ai.entity.CreditTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {

    Page<CreditTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<CreditTransaction> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, Instant after);

    @Query("SELECT SUM(ct.amount) FROM CreditTransaction ct WHERE ct.userId = ?1 AND ct.type = ?2")
    Integer sumAmountByUserIdAndType(Long userId, String type);

    @Query("SELECT ct.feature, SUM(ABS(ct.amount)) FROM CreditTransaction ct " +
           "WHERE ct.userId = ?1 AND ct.amount < 0 GROUP BY ct.feature")
    List<Object[]> getUsageByFeature(Long userId);
}
