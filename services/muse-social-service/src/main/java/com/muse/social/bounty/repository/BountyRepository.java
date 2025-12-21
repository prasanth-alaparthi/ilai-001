package com.muse.social.bounty.repository;

import com.muse.social.bounty.entity.Bounty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BountyRepository extends JpaRepository<Bounty, Long> {

    // Find open bounties
    Page<Bounty> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    // Find by subject
    Page<Bounty> findBySubjectAndStatusOrderByCreatedAtDesc(
            String subject, String status, Pageable pageable);

    // Find bounties created by user
    List<Bounty> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    // Find bounties solved by user
    List<Bounty> findBySolverIdOrderByCreatedAtDesc(Long solverId);

    // Search by title or description
    @Query("SELECT b FROM Bounty b WHERE " +
            "(LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND b.status = :status ORDER BY b.createdAt DESC")
    Page<Bounty> searchBounties(String query, String status, Pageable pageable);

    // Count by status
    long countByStatus(String status);

    // Count by creator
    long countByCreatorId(Long creatorId);

    // Count solved by user
    long countBySolverId(Long solverId);

    // Find trending (most viewed open bounties)
    @Query("SELECT b FROM Bounty b WHERE b.status = 'open' " +
            "ORDER BY b.viewCount DESC, b.rewardPoints DESC")
    Page<Bounty> findTrending(Pageable pageable);

    // Find high reward bounties
    @Query("SELECT b FROM Bounty b WHERE b.status = 'open' " +
            "AND b.rewardPoints >= :minReward ORDER BY b.rewardPoints DESC")
    Page<Bounty> findHighReward(Integer minReward, Pageable pageable);
}
