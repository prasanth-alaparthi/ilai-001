package com.muse.notes.repository;

import com.muse.notes.entity.NoteLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteLinkRepository extends JpaRepository<NoteLink, NoteLink.NoteLinkId> {
    List<NoteLink> findBySourceNoteIdOrderByRelevanceScoreDesc(Long sourceNoteId);

    List<NoteLink> findByLinkedNoteIdOrderByRelevanceScoreDesc(Long linkedNoteId);

    void deleteBySourceNoteId(Long sourceNoteId);

    void deleteByLinkedNoteId(Long linkedNoteId);
}
