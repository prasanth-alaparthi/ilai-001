package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.MoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface MoodEntryRepository extends JpaRepository<MoodEntry, Long> {
    List<MoodEntry> findByUsernameAndCreatedAtAfter(String username, Instant after);
}
