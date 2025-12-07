package com.muse.journal.repository;

import com.muse.journal.entity.SharedJournal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SharedJournalRepository extends JpaRepository<SharedJournal, String> {
    Optional<SharedJournal> findByToken(String token); // Added this method
}
