package com.muse.academic.academic.repository;

import com.muse.academic.academic.entity.ClubPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubPostRepository extends JpaRepository<ClubPost, Long> {

    List<ClubPost> findByClubIdOrderByIsPinnedDescCreatedAtDesc(Long clubId);

    @Query("SELECT p FROM ClubPost p WHERE p.club.id = :clubId AND p.isAnnouncement = true ORDER BY p.createdAt DESC")
    List<ClubPost> findAnnouncementsByClubId(Long clubId);

    List<ClubPost> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}
