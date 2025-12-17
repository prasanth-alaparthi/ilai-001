package com.muse.ai.repository;

import com.muse.ai.entity.XpTransaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface XpTransactionRepository extends JpaRepository<XpTransaction, UUID> {

    List<XpTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<XpTransaction> findByUserIdAndCreatedAtAfter(Long userId, Instant after);

    @Query("SELECT SUM(x.xpAmount) FROM XpTransaction x WHERE x.userId = :userId AND x.createdAt > :after")
    Long sumXpByUserIdAndCreatedAtAfter(Long userId, Instant after);

    @Query("SELECT x.eventType, SUM(x.xpAmount) FROM XpTransaction x WHERE x.userId = :userId GROUP BY x.eventType")
    List<Object[]> getXpBreakdownByEventType(Long userId);

    long countByUserIdAndEventTypeAndCreatedAtAfter(Long userId, String eventType, Instant after);
}
