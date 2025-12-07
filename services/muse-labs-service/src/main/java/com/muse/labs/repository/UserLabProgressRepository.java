package com.muse.labs.repository;

import com.muse.labs.entity.UserLabProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLabProgressRepository extends JpaRepository<UserLabProgress, Long> {
    Optional<UserLabProgress> findByUserIdAndLabId(String userId, Long labId);

    List<UserLabProgress> findByUserId(String userId);
}
