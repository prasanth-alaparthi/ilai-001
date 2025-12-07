package com.muse.notes.repository;

import com.muse.notes.entity.Notebook;
import com.muse.notes.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {

    List<Section> findByNotebookIdAndNotebookOwnerUsernameOrderByOrderIndexAsc(Long notebookId, String username);

    Optional<Section> findByNotebookAndTitle(Notebook notebook, String title);

    Optional<Section> findByIdAndNotebookOwnerUsername(Long id, String username);

    @Query("SELECT COALESCE(MAX(s.orderIndex), 0) FROM Section s WHERE s.notebook.id = :notebookId")
    int findMaxOrderIndexByNotebookId(@Param("notebookId") Long notebookId);
}
