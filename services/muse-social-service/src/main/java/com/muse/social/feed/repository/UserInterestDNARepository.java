package com.muse.social.feed.repository;

import com.muse.social.feed.entity.UserInterestDNA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInterestDNARepository extends JpaRepository<UserInterestDNA, Long> {

    Optional<UserInterestDNA> findByUserIdAndHashtag(String userId, String hashtag);

    @Query("SELECT u FROM UserInterestDNA u WHERE u.userId = :userId ORDER BY u.interestScore DESC")
    List<UserInterestDNA> findTopInterestsByUserId(@Param("userId") String userId);

    @Query("SELECT u FROM UserInterestDNA u WHERE u.userId = :userId ORDER BY u.interestScore DESC LIMIT :limit")
    List<UserInterestDNA> findTopInterestsByUserId(@Param("userId") String userId, @Param("limit") int limit);

    @Query("SELECT u FROM UserInterestDNA u WHERE u.userId = :userId AND u.momentum > 1.5 ORDER BY u.momentum DESC")
    List<UserInterestDNA> findHighMomentumInterests(@Param("userId") String userId);

    List<UserInterestDNA> findByUserId(String userId);

    @Query("SELECT DISTINCT u.hashtag FROM UserInterestDNA u WHERE u.hashtag LIKE :prefix% ORDER BY u.interestScore DESC")
    List<String> suggestHashtags(@Param("prefix") String prefix);
}
