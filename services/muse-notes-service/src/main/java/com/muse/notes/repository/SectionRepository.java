package com.muse.notes.repository;

import com.muse.notes.entity.Notebook;
import com.muse.notes.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {

    // Get all sections for a notebook (flat list, for backwards compatibility)
    List<Section> findByNotebookIdAndNotebookUserIdOrderByOrderIndexAsc(Long notebookId, Long userId);

    // Get only ROOT sections (parent is null) for a notebook
    @Query("SELECT s FROM Section s WHERE s.notebook.id = :notebookId AND s.notebook.userId = :userId AND s.parent IS NULL ORDER BY s.orderIndex ASC")
    List<Section> findRootSectionsByNotebookIdAndUserId(@Param("notebookId") Long notebookId,
            @Param("userId") Long userId);

    // Get child sections of a parent section
    @Query("SELECT s FROM Section s WHERE s.parent.id = :parentId ORDER BY s.orderIndex ASC")
    List<Section> findByParentId(@Param("parentId") Long parentId);

    Optional<Section> findByNotebookAndTitle(Notebook notebook, String title);

    Optional<Section> findByIdAndNotebookUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(s.orderIndex), 0) FROM Section s WHERE s.notebook.id = :notebookId AND s.parent IS NULL")
    int findMaxOrderIndexByNotebookId(@Param("notebookId") Long notebookId);

    @Query("SELECT COALESCE(MAX(s.orderIndex), 0) FROM Section s WHERE s.parent.id = :parentId")
    int findMaxOrderIndexByParentId(@Param("parentId") Long parentId);

    Optional<Section> findByNotebookIdAndTitle(Long notebookId, String title);

    // Maintain legacy for migration period
    List<Section> findByNotebookIdAndNotebookOwnerUsernameOrderByOrderIndexAsc(Long notebookId, String username);

    @Query("SELECT s FROM Section s WHERE s.notebook.id = :notebookId AND s.notebook.ownerUsername = :username AND s.parent IS NULL ORDER BY s.orderIndex ASC")
    List<Section> findRootSectionsByNotebookId(@Param("notebookId") Long notebookId,
            @Param("username") String username);

    Optional<Section> findByIdAndNotebookOwnerUsername(Long id, String username);
}
