package com.muse.auth.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.auth.ai.repository.AIJobRepository;
import com.muse.auth.ai.entity.AIJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AIService handles:
 * - enqueueing jobs
 * - direct operations (stubs) when AI provider is not configured
 * - inserting embeddings (via JdbcTemplate native SQL when vector column used)
 */
@Service
public class AIService {

    private final Logger log = LoggerFactory.getLogger(AIService.class);
    private final AIJobRepository jobRepo;
    private final ObjectMapper mapper;
    private final JdbcTemplate jdbc;
    private final String openaiApiKey;
    private final boolean usePgVector;

    public AIService(AIJobRepository jobRepo,
            ObjectMapper mapper,
            JdbcTemplate jdbc,
            @Value("${OPENAI_API_KEY:}") String openaiApiKey,
            @Value("${ai.use-pgvector:true}") boolean usePgVector) {
        this.jobRepo = jobRepo;
        this.mapper = mapper;
        this.jdbc = jdbc;
        this.openaiApiKey = openaiApiKey;
        this.usePgVector = usePgVector;
    }

    public boolean isAiEnabled() {
        return openaiApiKey != null && !openaiApiKey.isBlank();
    }

    /**
     * Enqueue a job for summarization or embeddings.
     */
    public Map<String, Object> enqueueJob(String type, String sourceTable, Long sourceId, Map<String, Object> payload) {
        try {
            AIJob job = new AIJob();
            job.setType(type);
            job.setSourceTable(sourceTable);
            job.setSourceId(sourceId);
            job.setPayload(mapper.writeValueAsString(payload));
            job.setStatus("queued");
            job.setAttempts(0);
            jobRepo.save(job);
            return Map.of("jobId", job.getId(), "status", job.getStatus());
        } catch (Exception e) {
            log.error("Failed to enqueue job", e);
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Synchronous summarization fallback (stub) — extract first 2 sentences and
     * return.
     */
    public String summarizeSyncFallback(String text) {
        if (text == null)
            return "";
        // naive: take first 2 sentences
        String[] s = text.split("(?<=[.!?])\\s+");
        return Arrays.stream(s).limit(2).collect(Collectors.joining(" "));
    }

    /**
     * Insert embedding vector for a source. `vector` is a double[].
     * If pgvector is available we insert vector via native SQL; otherwise we can
     * store as jsonb in metadata.
     */
    @Transactional
    public void saveEmbeddingNative(String sourceTable, Long sourceId, String model, double[] vector,
            Map<String, Object> metadata) {
        try {
            String metaJson = mapper.writeValueAsString(metadata == null ? Collections.emptyMap() : metadata);
            if (usePgVector) {
                // Insert into embeddings with vector set using the vector literal: e.g.
                // ARRAY[...]::vector
                // The vector dimension should match the column definition.
                // We'll insert via native SQL.
                String placeholders = Arrays.stream(vector).mapToObj(d -> String.valueOf(d))
                        .collect(Collectors.joining(","));
                String sql = "INSERT INTO embeddings (source_table, source_id, model, vector, metadata) VALUES (?, ?, ?, ?, ?::jsonb)";
                // For pgvector, bind the vector as a literal using the format: vector[1,2,...]
                // But JdbcTemplate doesn't know vector; easiest approach: use text
                // representation for vector: '["v1","v2",...]' and cast
                String vectorText = "ARRAY[" + placeholders + "]::vector";
                // Using a single SQL string combining vector literal (no parameter binding for
                // vector)
                String rawSql = "INSERT INTO embeddings (source_table, source_id, model, vector, metadata) VALUES ("
                        + "'" + sourceTable.replace("'", "''") + "', "
                        + sourceId + ", "
                        + "'" + model.replace("'", "''") + "', "
                        + vectorText + ", "
                        + "'" + metaJson.replace("'", "''") + "'::jsonb)";
                jdbc.execute(rawSql);
            } else {
                // fallback: store metadata/json only, no vector index
                String sql = "INSERT INTO embeddings (source_table, source_id, model, metadata) VALUES (?, ?, ?, ?::jsonb)";
                jdbc.update(sql, sourceTable, sourceId, model, metaJson);
            }
        } catch (Exception e) {
            log.error("Failed to save embedding native", e);
            throw new RuntimeException(e);
        }
    }
}