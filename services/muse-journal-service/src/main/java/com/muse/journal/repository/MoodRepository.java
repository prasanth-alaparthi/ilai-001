package com.muse.journal.repository;

import com.muse.journal.entity.Mood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface MoodRepository extends JpaRepository<Mood, Long> {
    Optional<Mood> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);
}
