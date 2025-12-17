package com.muse.ai.repository;

import com.muse.ai.entity.NoteEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Repository for NoteEmbedding with vector similarity search
 */
@Repository
public interface NoteEmbeddingRepository extends JpaRepository<NoteEmbedding, Long> {

    /**
     * Find all embeddings for a specific note
     */
    List<NoteEmbedding> findByNoteIdOrderByChunkIndex(Long noteId);

    /**
     * Find all embeddings for a user
     */
    List<NoteEmbedding> findByUserId(Long userId);

    /**
     * Check if note has embeddings
     */
    boolean existsByNoteId(Long noteId);

    /**
     * Delete all embeddings for a note (for re-indexing)
     */
    @Modifying
    @Transactional
    void deleteByNoteId(Long noteId);

    /**
     * Semantic search using cosine similarity
     * Returns note IDs and similarity scores ordered by relevance
     */
    @Query(value = """
            SELECT ne.note_id, ne.chunk_text,
                   1 - (ne.embedding <=> cast(:queryVector as vector)) as similarity
            FROM note_embeddings ne
            WHERE ne.user_id = :userId
            ORDER BY ne.embedding <=> cast(:queryVector as vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findSimilarNotes(
            @Param("queryVector") String queryVector,
            @Param("userId") Long userId,
            @Param("limit") int limit);

    /**
     * Semantic search with minimum similarity threshold
     */
    @Query(value = """
            SELECT ne.note_id, ne.chunk_text,
                   1 - (ne.embedding <=> cast(:queryVector as vector)) as similarity
            FROM note_embeddings ne
            WHERE ne.user_id = :userId
              AND 1 - (ne.embedding <=> cast(:queryVector as vector)) >= :minSimilarity
            ORDER BY ne.embedding <=> cast(:queryVector as vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findSimilarNotesWithThreshold(
            @Param("queryVector") String queryVector,
            @Param("userId") Long userId,
            @Param("minSimilarity") double minSimilarity,
            @Param("limit") int limit);

    /**
     * Count embeddings for a user
     */
    long countByUserId(Long userId);

    /**
     * Find embedding by note ID and chunk index
     */
    Optional<NoteEmbedding> findByNoteIdAndChunkIndex(Long noteId, Integer chunkIndex);
}
