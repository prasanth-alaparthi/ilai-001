package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findByUserIdOrderByUpdatedAtDesc(Long userId);

    // Mood is in a separate entity, so we can't filter by mood here directly
    // without a join or separate query.
    // Removing findByAuthorUsernameAndMoodOrderByUpdatedAtDesc for now.

    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT j FROM JournalEntry j WHERE j.userId = :userId AND (LOWER(j.highlights) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(j.challenges) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(j.intentions) LIKE LOWER(CONCAT('%',:q,'%'))) ORDER BY j.updatedAt DESC")
    List<JournalEntry> searchByUserIdAndQuery(@Param("userId") Long userId, @Param("q") String q);
}
