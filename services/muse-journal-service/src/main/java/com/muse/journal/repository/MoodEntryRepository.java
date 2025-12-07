package com.muse.journal.repository;

import com.muse.journal.entity.MoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface MoodEntryRepository extends JpaRepository<MoodEntry, Long> {
    List<MoodEntry> findByUsernameAndCreatedAtAfter(String username, Instant after);
}
