package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    Optional<JournalEntry> findByUserIdAndEntryDateAndDeletedAtIsNull(Long userId, LocalDate entryDate);

    List<JournalEntry> findByUserIdAndEntryDateBetweenAndDeletedAtIsNull(Long userId, LocalDate startDate,
            LocalDate endDate);

    List<JournalEntry> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    // Trash related
    List<JournalEntry> findByUserIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long userId);

    // Tag related
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM journal_entries WHERE user_id = :userId AND :tag = ANY(tags) AND deleted_at IS NULL", nativeQuery = true)
    List<JournalEntry> findByUserIdAndTag(Long userId, String tag);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM journal_entries WHERE user_id = :userId AND (title ILIKE %:query% OR content_json ILIKE %:query% OR highlights ILIKE %:query% OR challenges ILIKE %:query% OR intentions ILIKE %:query%) AND deleted_at IS NULL", nativeQuery = true)
    List<JournalEntry> search(Long userId, String query);

    // Semantic search using pgvector embeddings
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM journal_entries WHERE user_id = :userId AND embedding IS NOT NULL AND deleted_at IS NULL ORDER BY embedding <=> cast(:embedding as vector) LIMIT :limit", nativeQuery = true)
    List<JournalEntry> searchByEmbedding(Long userId, String embedding, int limit);

    // Find entries needing embedding
    List<JournalEntry> findByUserIdAndEmbeddingIsNullAndDeletedAtIsNull(Long userId);

    // For insight date range (needed by JournalInsightService)
    @org.springframework.data.jpa.repository.Query("SELECT e FROM JournalEntry e WHERE e.userId = :userId AND e.entryDate BETWEEN :startDate AND :endDate")
    List<JournalEntry> findByUserIdAndEntryDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
