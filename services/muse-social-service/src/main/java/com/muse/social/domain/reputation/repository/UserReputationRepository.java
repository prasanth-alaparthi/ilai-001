package com.muse.social.domain.reputation.repository;

import com.muse.social.domain.reputation.entity.UserReputation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserReputationRepository extends JpaRepository<UserReputation, Long> {

    Optional<UserReputation> findByUserId(Long userId);

    @Query("SELECT r FROM UserReputation r ORDER BY r.totalScore DESC")
    List<UserReputation> findTopUsers(Pageable pageable);

    @Query("SELECT r FROM UserReputation r WHERE r.streakDays > 0 ORDER BY r.streakDays DESC")
    List<UserReputation> findActiveStreaks(Pageable pageable);
}
