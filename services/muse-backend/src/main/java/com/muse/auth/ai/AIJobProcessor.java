package com.muse.auth.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.auth.ai.entity.AIJob;
import com.muse.auth.ai.repository.AIJobRepository;
import com.muse.auth.ai.service.AIService;
import com.muse.auth.ai.service.OpenAIIntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class AIJobProcessor {

    private final Logger log = LoggerFactory.getLogger(AIJobProcessor.class);
    private final AIJobRepository jobRepo;
    private final OpenAIIntegrationService openAI;
    private final AIService aiService;
    private final ObjectMapper mapper;

    public AIJobProcessor(AIJobRepository jobRepo, OpenAIIntegrationService openAI, AIService aiService,
            ObjectMapper mapper) {
        this.jobRepo = jobRepo;
        this.openAI = openAI;
        this.aiService = aiService;
        this.mapper = mapper;
    }

    /**
     * Runs every 10 seconds to pick queued jobs and process them.
     */
    @Scheduled(fixedDelay = 10_000)
    public void processJobs() {
        List<AIJob> jobs = jobRepo.findByStatusOrderByCreatedAtAsc("queued");
        for (AIJob job : jobs) {
            try {
                job.setStatus("running");
                job.setAttempts(job.getAttempts() + 1);
                jobRepo.save(job);

                if ("embedding".equals(job.getType())) {
                    handleEmbedding(job);
                } else if ("summary".equals(job.getType())) {
                    handleSummary(job);
                } else {
                    log.warn("Unknown job type: {}", job.getType());
                    job.setStatus("failed");
                    jobRepo.save(job);
                }
            } catch (Exception e) {
                log.error("Job processing error", e);
                job.setStatus("failed");
                job.setResult("{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}");
                jobRepo.save(job);
            }
        }
    }

    private void handleEmbedding(AIJob job) throws Exception {
        String srcTable = job.getSourceTable();
        Long srcId = job.getSourceId();

        // Journal processing disabled in muse-backend as journal service is now
        // separate.
        if ("journals".equals(srcTable)) {
            log.info("Skipping journal embedding in backend service. Should be handled by journal-service.");
            job.setStatus("skipped");
            jobRepo.save(job);
            return;
        }

        /*
         * Optional<JournalEntry> jOpt = Optional.empty();
         * if ("journals".equals(srcTable)) {
         * jOpt = journalRepo.findById(srcId);
         * }
         * String text = "";
         * if (jOpt.isPresent()) {
         * JournalEntry j = jOpt.get();
         * text = (j.getHighlights() != null ? j.getHighlights() : "") + " " +
         * (j.getChallenges() != null ? j.getChallenges() : "") + " " +
         * (j.getIntentions() != null ? j.getIntentions() : "");
         * } else {
         * log.warn("Source not found for embedding job: {} {}", srcTable, srcId);
         * job.setStatus("failed");
         * jobRepo.save(job);
         * return;
         * }
         */

        // Placeholder for other types if any
        log.warn("No handler for source table: {}", srcTable);
        job.setStatus("failed");
        jobRepo.save(job);

        /*
         * double[] vector;
         * if (openAI.enabled()) {
         * vector = openAI.embed("text-embedding-3-small", text);
         * } else {
         * // fallback: create small fake embedding by hashing words -> deterministic
         * small
         * // vector
         * String[] words = text.split("\\s+");
         * vector = generateFallbackVector(words, 1536); // match dimension used in
         * migration
         * }
         * // Save vector in DB (native insert)
         * Map<String, Object> meta = Map.of("source", srcTable, "sourceId", srcId);
         * aiService.saveEmbeddingNative(srcTable, srcId, openAI.enabled() ?
         * "text-embedding-3-small" : "stub-model",
         * vector, meta);
         * 
         * job.setStatus("success");
         * job.setResult("{\"message\":\"embedding saved\"}");
         * jobRepo.save(job);
         */
    }

    private void handleSummary(AIJob job) throws Exception {
        // Summary feature is not supported in the new JournalEntry schema (no 'summary'
        // field).
        // Marking job as skipped/success.
        job.setStatus("success");
        job.setResult("{\"message\":\"summary not supported for new schema\"}");
        jobRepo.save(job);
    }

    private double[] generateFallbackVector(String[] words, int dim) {
        double[] v = new double[dim];
        for (int i = 0; i < words.length; i++) {
            int idx = Math.abs(words[i].hashCode()) % dim;
            v[idx] += 1.0;
        }
        // normalize
        double norm = 0;
        for (double val : v)
            norm += val * val;
        norm = Math.sqrt(norm == 0 ? 1 : norm);
        for (int i = 0; i < dim; i++)
            v[i] /= norm;
        return v;
    }
}
