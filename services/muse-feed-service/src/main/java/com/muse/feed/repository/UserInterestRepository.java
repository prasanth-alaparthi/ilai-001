package com.muse.feed.repository;

import com.muse.feed.entity.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {
    List<UserInterest> findByUserId(Long userId);
    Optional<UserInterest> findByUserIdAndInterestTypeAndInterestValue(Long userId, String interestType, String interestValue);
}
