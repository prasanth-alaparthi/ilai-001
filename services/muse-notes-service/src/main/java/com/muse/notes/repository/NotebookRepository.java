package com.muse.notes.repository;

import com.muse.notes.entity.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotebookRepository extends JpaRepository<Notebook, Long> {

    List<Notebook> findByUserIdOrderByOrderIndexAsc(Long userId);

    Optional<Notebook> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(n.orderIndex), 0) FROM Notebook n WHERE n.userId = :userId")
    int findMaxOrderIndexByUserId(@Param("userId") Long userId);

    Optional<Notebook> findByUserIdAndTitle(Long userId, String title);

    // Maintain legacy for migration period
    List<Notebook> findByOwnerUsernameOrderByOrderIndexAsc(String ownerUsername);

    Optional<Notebook> findByIdAndOwnerUsername(Long id, String ownerUsername);

    @Query("SELECT COALESCE(MAX(n.orderIndex), 0) FROM Notebook n WHERE n.ownerUsername = :username")
    int findMaxOrderIndexByOwnerUsername(@Param("username") String username);

    Optional<Notebook> findByOwnerUsernameAndTitle(String ownerUsername, String title);
}
