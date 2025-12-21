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

    void deleteBySourceNoteIdAndLinkedNoteId(Long sourceNoteId, Long linkedNoteId);

    @org.springframework.data.jpa.repository.Query("SELECT nl FROM NoteLink nl JOIN Note n ON nl.sourceNoteId = n.id WHERE n.userId = :userId")
    List<NoteLink> findAllBySourceUser(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT nl FROM NoteLink nl JOIN Note n ON nl.sourceNoteId = n.id WHERE n.ownerUsername = :username")
    List<NoteLink> findAllBySourceUserUsername(
            @org.springframework.data.repository.query.Param("username") String username);
}
