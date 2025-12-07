package com.muse.feed.repository;

import com.muse.feed.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsBySourceUrl(String sourceUrl);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findTop20ByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "DELETE FROM posts WHERE id NOT IN (SELECT MIN(id) FROM posts WHERE source_url IS NOT NULL GROUP BY source_url)", nativeQuery = true)
    void deleteDuplicatePosts();

    @Query(value = "SELECT * FROM posts ORDER BY embedding <-> CAST(string_to_array(:embedding, ',') AS vector) LIMIT :limit", nativeQuery = true)
    List<Post> findNearestByEmbedding(@Param("embedding") String embedding, @Param("limit") int limit);
}
