package com.muse.social.feed.repository;

import com.muse.social.feed.entity.FeedUserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedUserProfileRepository extends JpaRepository<FeedUserProfile, String> {

    Optional<FeedUserProfile> findByUserId(String userId);

    @Query("SELECT p FROM FeedUserProfile p WHERE p.isVerified = true ORDER BY p.followerCount DESC")
    List<FeedUserProfile> findVerifiedUsers();

    @Query("SELECT p FROM FeedUserProfile p WHERE LOWER(p.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.credentials) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<FeedUserProfile> searchProfiles(@Param("query") String query);

    @Query("SELECT p FROM FeedUserProfile p WHERE p.institution = :institution")
    List<FeedUserProfile> findByInstitution(@Param("institution") String institution);
}
