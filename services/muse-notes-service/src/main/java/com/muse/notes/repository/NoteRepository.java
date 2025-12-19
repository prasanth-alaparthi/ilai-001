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

       List<Note> findByOwnerUsernameOrderByOrderIndexAsc(String ownerUsername);

       List<Note> findBySectionIdAndOwnerUsernameOrderByOrderIndexAsc(Long sectionId, String ownerUsername);

       Optional<Note> findByIdAndOwnerUsername(Long id, String ownerUsername);

       long countByOwnerUsername(String ownerUsername);

       Page<Note> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content,
                     Pageable p);

       @Query(value = "SELECT * FROM notes WHERE owner_username = :username AND content_tsvector @@ to_tsquery('english', :query)", nativeQuery = true)
       List<Note> searchByQuery(@Param("username") String username, @Param("query") String query);

       @Query(value = "SELECT * FROM notes WHERE owner_username = :username ORDER BY embedding <-> CAST(:embedding AS vector) LIMIT :limit", nativeQuery = true)
       List<Note> searchByEmbedding(@Param("username") String username, @Param("embedding") String embedding,
                     @Param("limit") int limit);

       @Query("SELECT COALESCE(MAX(n.orderIndex), 0) FROM Note n WHERE n.section.id = :sectionId")
       int findMaxOrderIndexBySectionId(@Param("sectionId") Long sectionId);

       List<Note> findByOwnerUsernameAndIsPinnedTrueOrderByUpdatedAtDesc(String ownerUsername);

       @Query("SELECT n FROM Note n JOIN NotePermission p ON n.id = p.note.id WHERE p.username = :username")
       List<Note> findSharedWithUser(@Param("username") String username);

       // Trash queries
       List<Note> findByOwnerUsernameAndDeletedAtIsNotNullOrderByDeletedAtDesc(String ownerUsername);

       List<Note> findByOwnerUsernameAndDeletedAtIsNullOrderByOrderIndexAsc(String ownerUsername);

       List<Note> findBySectionIdAndOwnerUsernameAndDeletedAtIsNullOrderByOrderIndexAsc(Long sectionId,
                     String ownerUsername);

       // Tag queries
       @Query(value = "SELECT * FROM notes WHERE owner_username = :username AND deleted_at IS NULL AND :tag = ANY(tags)", nativeQuery = true)
       List<Note> findByOwnerUsernameAndTag(@Param("username") String username, @Param("tag") String tag);

       Optional<Note> findByOwnerUsernameAndTitleIgnoreCaseAndDeletedAtIsNull(String ownerUsername, String title);
}
