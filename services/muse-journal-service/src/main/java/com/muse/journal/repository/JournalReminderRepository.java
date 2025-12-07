package com.muse.journal.repository;

import com.muse.journal.entity.JournalReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface JournalReminderRepository extends JpaRepository<JournalReminder, Long> {
    List<JournalReminder> findByRemindAtBeforeAndSent(Instant before, Boolean sent);

    List<JournalReminder> findByUsernameOrderByRemindAtDesc(String username);
}
