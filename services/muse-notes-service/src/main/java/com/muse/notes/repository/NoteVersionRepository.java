package com.muse.notes.repository;

import com.muse.notes.entity.NoteVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteVersionRepository extends JpaRepository<NoteVersion, Long> {
    List<NoteVersion> findByNoteIdOrderByCreatedAtDesc(Long noteId);
}
