package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.JournalReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface JournalReminderRepository extends JpaRepository<JournalReminder, Long> {
    List<JournalReminder> findByRemindAtBeforeAndSent(Instant before, Boolean sent);

    List<JournalReminder> findByUsernameOrderByRemindAtDesc(String username);

    void deleteByJournalId(Long journalId);
}
