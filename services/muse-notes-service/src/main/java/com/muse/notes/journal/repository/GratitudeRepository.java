package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.Gratitude;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GratitudeRepository extends JpaRepository<Gratitude, Long> {
    List<Gratitude> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    void deleteByUserIdAndEntryDate(Long userId, LocalDate entryDate);
}
