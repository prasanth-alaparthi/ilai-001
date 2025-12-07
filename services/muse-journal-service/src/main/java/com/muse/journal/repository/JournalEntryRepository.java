package com.muse.journal.repository;

import com.muse.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    Optional<JournalEntry> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    List<JournalEntry> findByUserIdAndEntryDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    List<JournalEntry> findByUserIdOrderByCreatedAtDesc(Long userId);
}
