package com.muse.ai.repository;

import com.muse.ai.entity.UserCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCreditRepository extends JpaRepository<UserCredit, UUID> {

    Optional<UserCredit> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
