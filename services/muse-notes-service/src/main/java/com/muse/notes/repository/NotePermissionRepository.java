package com.muse.notes.repository;

import com.muse.notes.entity.NotePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotePermissionRepository extends JpaRepository<NotePermission, Long> {
    Optional<NotePermission> findByNoteIdAndUserId(Long noteId, Long userId);

    List<NotePermission> findByNoteId(Long noteId);

    List<NotePermission> findByUserId(Long userId);

    // Maintain legacy for migration period
    Optional<NotePermission> findByNoteIdAndUsername(Long noteId, String username);

    List<NotePermission> findByUsername(String username);

    void deleteByNoteId(Long noteId);
}
