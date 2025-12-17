package com.muse.ai.repository;

import com.muse.ai.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    List<Job> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Job> findByStatus(String status);

    @Query("SELECT j FROM Job j WHERE j.status = 'PENDING' AND j.scheduledAt <= :now ORDER BY j.scheduledAt")
    List<Job> findDueJobs(Instant now);

    List<Job> findByUserIdAndJobType(Long userId, String jobType);

    @Query("SELECT j FROM Job j WHERE j.status = 'RUNNING' AND j.startedAt < :timeout")
    List<Job> findStaleJobs(Instant timeout);
}
