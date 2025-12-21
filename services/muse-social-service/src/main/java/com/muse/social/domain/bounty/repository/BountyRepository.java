package com.muse.social.domain.bounty.repository;

import com.muse.social.domain.bounty.entity.Bounty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BountyRepository extends JpaRepository<Bounty, Long> {

    Page<Bounty> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<Bounty> findBySubjectAndStatusOrderByCreatedAtDesc(String subject, String status, Pageable pageable);

    List<Bounty> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    List<Bounty> findBySolverIdOrderByCreatedAtDesc(Long solverId);

    @Query("SELECT b FROM Bounty b WHERE b.status = :status AND " +
            "(LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY b.createdAt DESC")
    Page<Bounty> searchBounties(String query, String status, Pageable pageable);

    @Query("SELECT b FROM Bounty b WHERE b.status = 'open' " +
            "ORDER BY b.viewCount DESC, b.rewardPoints DESC")
    Page<Bounty> findTrending(Pageable pageable);

    @Query("SELECT b FROM Bounty b WHERE b.status = 'open' " +
            "AND b.rewardPoints >= :minReward ORDER BY b.rewardPoints DESC")
    Page<Bounty> findHighReward(Integer minReward, Pageable pageable);

    long countByStatus(String status);

    long countByCreatorId(Long creatorId);

    long countBySolverId(Long solverId);
}
