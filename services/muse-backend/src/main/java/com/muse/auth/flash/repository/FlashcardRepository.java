package com.muse.auth.flash.repository;

import com.muse.auth.flash.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    Optional<Flashcard> findBySourceFeedItemId(Long sourceFeedItemId);
    List<Flashcard> findByOwnerUsernameOrderByCreatedAtDesc(String ownerUsername);
    List<Flashcard> findByNoteId(Long noteId);
}