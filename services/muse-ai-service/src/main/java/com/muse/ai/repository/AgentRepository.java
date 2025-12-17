package com.muse.ai.repository;

import com.muse.ai.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentRepository extends JpaRepository<Agent, UUID> {
    List<Agent> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Agent> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    List<Agent> findByStatus(String status);
}
