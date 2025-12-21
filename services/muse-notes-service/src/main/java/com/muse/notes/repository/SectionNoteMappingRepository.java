package com.muse.notes.repository;

import com.muse.notes.entity.SectionNoteMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectionNoteMappingRepository extends JpaRepository<SectionNoteMapping, Long> {
    List<SectionNoteMapping> findBySectionId(Long sectionId);

    List<SectionNoteMapping> findByNoteId(Long noteId);

    Optional<SectionNoteMapping> findBySectionIdAndNoteId(Long sectionId, Long noteId);
}
