package com.muse.ai.repository;

import com.muse.ai.entity.ResearchCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for ResearchCache with TTL support
 */
@Repository
public interface ResearchCacheRepository extends JpaRepository<ResearchCache, Long> {

    /**
     * Find cached result by query hash and source type
     */
    Optional<ResearchCache> findByQueryHashAndSourceType(String queryHash, String sourceType);

    /**
     * Find valid (non-expired) cached result
     */
    @Query("SELECT r FROM ResearchCache r WHERE r.queryHash = :queryHash AND r.sourceType = :sourceType AND r.expiresAt > :now")
    Optional<ResearchCache> findValidCache(String queryHash, String sourceType, LocalDateTime now);

    /**
     * Delete expired cache entries
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM ResearchCache r WHERE r.expiresAt < :now")
    int deleteExpiredEntries(LocalDateTime now);

    /**
     * Count entries by source type
     */
    long countBySourceType(String sourceType);
}
