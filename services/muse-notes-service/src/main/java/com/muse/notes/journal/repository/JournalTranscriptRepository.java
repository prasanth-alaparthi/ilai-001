package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.JournalTranscript;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JournalTranscriptRepository extends JpaRepository<JournalTranscript, Long> {
    Optional<JournalTranscript> findFirstByJournalIdOrderByCreatedAtDesc(Long journalId);
}
