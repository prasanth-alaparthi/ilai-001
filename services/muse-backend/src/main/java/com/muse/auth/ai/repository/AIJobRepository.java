package com.muse.auth.ai.repository;

import com.muse.auth.ai.entity.AIJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AIJobRepository extends JpaRepository<AIJob, Long> {
    List<AIJob> findByStatusOrderByCreatedAtAsc(String status);
}
