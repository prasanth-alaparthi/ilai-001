package com.muse.auth.flash.repository;

import com.muse.auth.flash.entity.FlashcardItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardItemRepository extends JpaRepository<FlashcardItem, Long> {
    List<FlashcardItem> findByFlashcardIdOrderByIdAsc(Long flashcardId);
}