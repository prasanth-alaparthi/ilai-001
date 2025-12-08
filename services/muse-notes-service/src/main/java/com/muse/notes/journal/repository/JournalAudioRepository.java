package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.JournalAudio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional; // Added import for Optional

public interface JournalAudioRepository extends JpaRepository<JournalAudio, Long> {
    List<JournalAudio> findByJournalIdOrderByCreatedAtDesc(Long journalId);

    Optional<JournalAudio> findFirstByJournalIdOrderByCreatedAtDesc(Long journalId); // Added this method

    List<JournalAudio> findByUsernameOrderByCreatedAtDesc(String username);
}
