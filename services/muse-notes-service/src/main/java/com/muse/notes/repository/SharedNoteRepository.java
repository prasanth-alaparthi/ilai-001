// src/main/java/com/muse/auth/notes/repository/SharedNoteRepository.java
package com.muse.notes.repository;

import com.muse.notes.entity.SharedNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SharedNoteRepository extends JpaRepository<SharedNote, Long> {
    Optional<SharedNote> findByToken(String token);
}
