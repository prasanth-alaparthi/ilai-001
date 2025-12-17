package com.muse.ai.service;

import com.muse.ai.entity.Job;
import com.muse.ai.repository.JobRepository;
import com.muse.ai.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Background Job Service
 * Manages scheduled tasks and background processing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final UserProfileRepository userProfileRepository;
    private final PersonalizationService personalizationService;

    // ==================== Job Creation ====================

    /**
     * Create a new job
     */
    @Transactional
    public Job createJob(Long userId, String jobType, Map<String, Object> payload, Instant scheduledAt) {
        Job job = Job.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .jobType(jobType)
                .status("PENDING")
                .payload(payload)
                .scheduledAt(scheduledAt != null ? scheduledAt : Instant.now())
                .build();
        return jobRepository.save(job);
    }

    /**
     * Create a job to run immediately
     */
    public Job createImmediateJob(Long userId, String jobType, Map<String, Object> payload) {
        return createJob(userId, jobType, payload, Instant.now());
    }

    /**
     * Schedule a study reminder
     */
    public Job scheduleStudyReminder(Long userId, String topic, Instant reminderTime) {
        return createJob(userId, "STUDY_REMINDER",
                Map.of("topic", topic, "message", "Time to study " + topic + "!"),
                reminderTime);
    }

    /**
     * Schedule spaced repetition review
     */
    public Job scheduleSpacedRepetition(Long userId, String deckId, int intervalDays) {
        Instant reviewTime = Instant.now().plus(intervalDays, ChronoUnit.DAYS);
        return createJob(userId, "SPACED_REPETITION",
                Map.of("deckId", deckId, "intervalDays", intervalDays),
                reviewTime);
    }

    // ==================== Scheduled Tasks ====================

    /**
     * Process pending jobs every minute
     */
    @Scheduled(fixedRate = 60000) // Every minute
    @Transactional
    public void processPendingJobs() {
        List<Job> dueJobs = jobRepository.findDueJobs(Instant.now());

        for (Job job : dueJobs) {
            try {
                job.setStatus("RUNNING");
                job.setStartedAt(Instant.now());
                jobRepository.save(job);

                processJob(job);

                job.setStatus("COMPLETED");
                job.setCompletedAt(Instant.now());
            } catch (Exception e) {
                log.error("Job {} failed: {}", job.getId(), e.getMessage());
                job.setStatus("FAILED");
                job.setErrorMessage(e.getMessage());
                job.setCompletedAt(Instant.now());
            }
            jobRepository.save(job);
        }

        if (!dueJobs.isEmpty()) {
            log.info("Processed {} jobs", dueJobs.size());
        }
    }

    /**
     * Daily digest - runs at 8 AM
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendDailyDigest() {
        log.info("Running daily digest job");
        // Get all users with active profiles
        userProfileRepository.findAll().forEach(profile -> {
            try {
                createJob(profile.getUserId(), "DAILY_DIGEST", Map.of(), Instant.now());
            } catch (Exception e) {
                log.error("Failed to create digest job for user {}: {}",
                        profile.getUserId(), e.getMessage());
            }
        });
    }

    /**
     * Clean up stale jobs - runs every hour
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void cleanupStaleJobs() {
        // Jobs running for more than 30 minutes are considered stale
        Instant timeout = Instant.now().minus(30, ChronoUnit.MINUTES);
        List<Job> staleJobs = jobRepository.findStaleJobs(timeout);

        for (Job job : staleJobs) {
            job.setStatus("FAILED");
            job.setErrorMessage("Job timed out");
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        }

        if (!staleJobs.isEmpty()) {
            log.warn("Cleaned up {} stale jobs", staleJobs.size());
        }
    }

    // ==================== Job Processing ====================

    private void processJob(Job job) {
        switch (job.getJobType()) {
            case "STUDY_REMINDER" -> processStudyReminder(job);
            case "SPACED_REPETITION" -> processSpacedRepetition(job);
            case "DAILY_DIGEST" -> processDailyDigest(job);
            case "GENERATE_EMBEDDINGS" -> processGenerateEmbeddings(job);
            case "UPDATE_RECOMMENDATIONS" -> processUpdateRecommendations(job);
            default -> log.warn("Unknown job type: {}", job.getJobType());
        }
    }

    private void processStudyReminder(Job job) {
        Long userId = job.getUserId();
        String topic = (String) job.getPayload().get("topic");
        log.info("Sending study reminder to user {} for topic: {}", userId, topic);
        // TODO: Send push notification or email
        job.setResult(Map.of("sent", true));
    }

    private void processSpacedRepetition(Job job) {
        Long userId = job.getUserId();
        String deckId = (String) job.getPayload().get("deckId");
        log.info("Processing spaced repetition for user {} deck: {}", userId, deckId);
        // TODO: Fetch deck and schedule next review based on performance
        job.setResult(Map.of("processed", true));
    }

    private void processDailyDigest(Job job) {
        Long userId = job.getUserId();
        log.info("Generating daily digest for user {}", userId);

        // Get recommendations for the user
        Map<String, Object> recommendations = personalizationService.getRecommendations(userId);
        job.setResult(Map.of(
                "recommendations", recommendations,
                "generated", true));
    }

    private void processGenerateEmbeddings(Job job) {
        log.info("Processing embedding generation job: {}", job.getId());
        // TODO: Implement embedding generation for content
        job.setResult(Map.of("processed", true));
    }

    private void processUpdateRecommendations(Job job) {
        Long userId = job.getUserId();
        log.info("Updating recommendations for user {}", userId);
        personalizationService.getRecommendations(userId);
        job.setResult(Map.of("updated", true));
    }

    // ==================== Job Queries ====================

    public List<Job> getUserJobs(Long userId) {
        return jobRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Job> getJob(UUID jobId) {
        return jobRepository.findById(jobId);
    }

    public List<Job> getPendingJobs() {
        return jobRepository.findByStatus("PENDING");
    }
}
