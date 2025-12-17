package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.muse.ai.entity.NoteEmbedding;
import com.muse.ai.repository.NoteEmbeddingRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Embedding Service - Phase 3 RAG Foundation
 * Generates and manages vector embeddings using Gemini API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final NoteEmbeddingRepository embeddingRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String EMBEDDING_MODEL = "text-embedding-004";
    private static final String EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final int CHUNK_SIZE = 2000; // Characters per chunk
    private static final int MAX_TOKENS = 2048;
    private static final int EMBEDDING_DIMENSION = 768;

    /**
     * Generate embedding for a single text
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "embeddingFallback")
    @RateLimiter(name = "llm")
    public Mono<float[]> generateEmbedding(String text) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Mono.error(new IllegalStateException("Gemini API key not configured"));
        }

        String truncatedText = truncateText(text, MAX_TOKENS);

        Map<String, Object> request = Map.of(
                "model", "models/" + EMBEDDING_MODEL,
                "content", Map.of("parts", List.of(Map.of("text", truncatedText))));

        String url = EMBEDDING_URL + EMBEDDING_MODEL + ":embedContent?key=" + geminiApiKey;

        return webClientBuilder.build()
                .post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(this::extractEmbedding)
                .doOnSuccess(e -> log.debug("Generated embedding, dimension: {}", e.length))
                .doOnError(e -> log.error("Embedding generation failed: {}", e.getMessage()));
    }

    /**
     * Generate embeddings for multiple texts (batch)
     */
    public Mono<List<float[]>> generateEmbeddings(List<String> texts) {
        return Flux.fromIterable(texts)
                .flatMap(this::generateEmbedding)
                .collectList();
    }

    /**
     * Index a note - creates embeddings for searchability
     */
    public Mono<List<NoteEmbedding>> indexNote(Long noteId, Long userId, String content) {
        // Delete existing embeddings
        embeddingRepository.deleteByNoteId(noteId);

        // Split into chunks if needed
        List<String> chunks = chunkText(content);

        return Flux.fromIterable(chunks)
                .index()
                .flatMap(indexed -> {
                    int chunkIndex = indexed.getT1().intValue();
                    String chunkText = indexed.getT2();

                    return generateEmbedding(chunkText)
                            .map(embedding -> NoteEmbedding.builder()
                                    .noteId(noteId)
                                    .userId(userId)
                                    .chunkIndex(chunkIndex)
                                    .chunkText(chunkText)
                                    .embedding(embedding)
                                    .tokenCount(estimateTokens(chunkText))
                                    .build());
                })
                .collectList()
                .doOnSuccess(embeddings -> {
                    embeddingRepository.saveAll(embeddings);
                    log.info("Indexed note {} with {} chunks", noteId, embeddings.size());
                });
    }

    /**
     * Semantic search - find similar notes using vector similarity
     */
    public Mono<List<SemanticSearchResult>> searchSimilar(String query, Long userId, int limit) {
        return generateEmbedding(query)
                .map(queryEmbedding -> {
                    String vectorString = arrayToVectorString(queryEmbedding);
                    List<Object[]> results = embeddingRepository.findSimilarNotes(
                            vectorString, userId, limit);

                    return results.stream()
                            .map(row -> new SemanticSearchResult(
                                    ((Number) row[0]).longValue(), // noteId
                                    (String) row[1], // chunkText
                                    ((Number) row[2]).doubleValue() // similarity
                    ))
                            .collect(Collectors.toList());
                });
    }

    /**
     * Semantic search with minimum similarity threshold
     */
    public Mono<List<SemanticSearchResult>> searchSimilarWithThreshold(
            String query, Long userId, double minSimilarity, int limit) {
        return generateEmbedding(query)
                .map(queryEmbedding -> {
                    String vectorString = arrayToVectorString(queryEmbedding);
                    List<Object[]> results = embeddingRepository.findSimilarNotesWithThreshold(
                            vectorString, userId, minSimilarity, limit);

                    return results.stream()
                            .map(row -> new SemanticSearchResult(
                                    ((Number) row[0]).longValue(),
                                    (String) row[1],
                                    ((Number) row[2]).doubleValue()))
                            .collect(Collectors.toList());
                });
    }

    /**
     * Hybrid search - combines BM25 keyword + semantic vector search
     */
    public Mono<List<HybridSearchResult>> hybridSearch(
            String query, Long userId, List<Long> bm25Results, int limit) {

        return searchSimilar(query, userId, limit * 2)
                .map(semanticResults -> {
                    Map<Long, Double> semanticScores = semanticResults.stream()
                            .collect(Collectors.toMap(
                                    SemanticSearchResult::noteId,
                                    SemanticSearchResult::similarity,
                                    (a, b) -> Math.max(a, b)));

                    // Reciprocal Rank Fusion
                    Map<Long, Double> fusedScores = new HashMap<>();
                    int k = 60; // RRF constant

                    // Add BM25 contributions
                    for (int i = 0; i < bm25Results.size(); i++) {
                        Long noteId = bm25Results.get(i);
                        fusedScores.merge(noteId, 1.0 / (k + i + 1), Double::sum);
                    }

                    // Add semantic contributions
                    List<Long> semanticRanked = semanticResults.stream()
                            .map(SemanticSearchResult::noteId)
                            .toList();
                    for (int i = 0; i < semanticRanked.size(); i++) {
                        Long noteId = semanticRanked.get(i);
                        fusedScores.merge(noteId, 1.0 / (k + i + 1), Double::sum);
                    }

                    // Sort by fused score and return
                    return fusedScores.entrySet().stream()
                            .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                            .limit(limit)
                            .map(entry -> new HybridSearchResult(
                                    entry.getKey(),
                                    entry.getValue(),
                                    semanticScores.getOrDefault(entry.getKey(), 0.0),
                                    bm25Results.contains(entry.getKey())))
                            .collect(Collectors.toList());
                });
    }

    /**
     * Check if note is indexed
     */
    public boolean isNoteIndexed(Long noteId) {
        return embeddingRepository.existsByNoteId(noteId);
    }

    /**
     * Get embedding count for user
     */
    public long getEmbeddingCount(Long userId) {
        return embeddingRepository.countByUserId(userId);
    }

    // ============== Helper Methods ==============

    private float[] extractEmbedding(JsonNode response) {
        JsonNode values = response.path("embedding").path("values");
        if (!values.isArray()) {
            throw new RuntimeException("Invalid embedding response");
        }

        float[] embedding = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            embedding[i] = (float) values.get(i).asDouble();
        }
        return embedding;
    }

    private List<String> chunkText(String text) {
        if (text == null || text.length() <= CHUNK_SIZE) {
            return List.of(text != null ? text : "");
        }

        List<String> chunks = new ArrayList<>();
        int start = 0;

        while (start < text.length()) {
            int end = Math.min(start + CHUNK_SIZE, text.length());

            // Try to break at sentence boundary
            if (end < text.length()) {
                int sentenceEnd = text.lastIndexOf(". ", end);
                if (sentenceEnd > start + CHUNK_SIZE / 2) {
                    end = sentenceEnd + 1;
                }
            }

            chunks.add(text.substring(start, end).trim());
            start = end;
        }

        return chunks;
    }

    private String truncateText(String text, int maxTokens) {
        // Rough estimate: 1 token ≈ 4 characters
        int maxChars = maxTokens * 4;
        if (text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars);
    }

    private int estimateTokens(String text) {
        return (int) Math.ceil(text.length() / 4.0);
    }

    private String arrayToVectorString(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0)
                sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    private Mono<float[]> embeddingFallback(String text, Throwable t) {
        log.warn("Embedding fallback triggered: {}", t.getMessage());
        // Return zero vector as fallback
        return Mono.just(new float[EMBEDDING_DIMENSION]);
    }

    // ============== Result Records ==============

    public record SemanticSearchResult(Long noteId, String chunkText, double similarity) {
    }

    public record HybridSearchResult(Long noteId, double fusedScore, double semanticScore, boolean hasKeywordMatch) {
    }
}
