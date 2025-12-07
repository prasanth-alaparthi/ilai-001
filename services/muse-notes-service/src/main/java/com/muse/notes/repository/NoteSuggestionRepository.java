package com.muse.notes.repository;

import com.muse.notes.entity.NoteSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteSuggestionRepository extends JpaRepository<NoteSuggestion, Long> {
    List<NoteSuggestion> findByNoteIdOrderByCreatedAtDesc(Long noteId);
    void deleteByNoteId(Long noteId);
}
