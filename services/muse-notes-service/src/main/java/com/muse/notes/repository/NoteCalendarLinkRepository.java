package com.muse.notes.repository;

import com.muse.notes.entity.NoteCalendarLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteCalendarLinkRepository extends JpaRepository<NoteCalendarLink, Long> {
    List<NoteCalendarLink> findByNoteId(Long noteId);
    Optional<NoteCalendarLink> findByNoteIdAndCalendarEventIdAndCalendarProvider(Long noteId, String calendarEventId, String calendarProvider);
}
