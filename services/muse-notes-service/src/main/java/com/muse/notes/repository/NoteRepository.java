package com.muse.notes.repository;

import com.muse.notes.entity.Note;
import com.muse.notes.entity.Section;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

       List<Note> findBySectionOrderByOrderIndexAsc(Section section);

       Optional<Note> findByIdAndSection(Long id, Section section);

       List<Note> findByUserIdOrderByOrderIndexAsc(Long userId);

       List<Note> findBySectionIdAndUserIdOrderByOrderIndexAsc(Long sectionId, Long userId);

       Optional<Note> findByIdAndUserId(Long id, Long userId);

       long countByUserId(Long userId);

       Page<Note> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content,
                     Pageable p);

       @Query(value = "SELECT * FROM notes WHERE user_id = :userId AND content_tsvector @@ to_tsquery('english', :query)", nativeQuery = true)
       List<Note> searchByQuery(@Param("userId") Long userId, @Param("query") String query);

       @Query(value = "SELECT * FROM notes WHERE user_id = :userId ORDER BY embedding <-> CAST(:embedding AS vector) LIMIT :limit", nativeQuery = true)
       List<Note> searchByEmbedding(@Param("userId") Long userId, @Param("embedding") String embedding,
                     @Param("limit") int limit);

       @Query("SELECT COALESCE(MAX(n.orderIndex), 0) FROM Note n WHERE n.section.id = :sectionId")
       int findMaxOrderIndexBySectionId(@Param("sectionId") Long sectionId);

       List<Note> findByUserIdAndIsPinnedTrueOrderByUpdatedAtDesc(Long userId);

       @Query("SELECT n FROM Note n JOIN NotePermission p ON n.id = p.note.id WHERE p.userId = :userId")
       List<Note> findSharedWithUser(@Param("userId") Long userId);

       // Trash queries
       List<Note> findByUserIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long userId);

       List<Note> findByUserIdAndDeletedAtIsNullOrderByOrderIndexAsc(Long userId);

       List<Note> findBySectionIdAndUserIdAndDeletedAtIsNullOrderByOrderIndexAsc(Long sectionId,
                     Long userId);

       // Tag queries
       @Query(value = "SELECT * FROM notes WHERE user_id = :userId AND deleted_at IS NULL AND :tag = ANY(tags)", nativeQuery = true)
       List<Note> findByUserIdAndTag(@Param("userId") Long userId, @Param("tag") String tag);

       Optional<Note> findByUserIdAndTitleIgnoreCaseAndDeletedAtIsNull(Long userId, String title);
}
