package com.muse.academic.academic.repository;

import com.muse.academic.academic.entity.ClubEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClubEventRepository extends JpaRepository<ClubEvent, Long> {

    List<ClubEvent> findByClubIdOrderByEventDateAsc(Long clubId);

    @Query("SELECT e FROM ClubEvent e WHERE e.club.id = :clubId AND e.eventDate >= :now ORDER BY e.eventDate ASC")
    List<ClubEvent> findUpcomingByClubId(Long clubId, LocalDateTime now);

    @Query("SELECT e FROM ClubEvent e WHERE e.club.id = :clubId AND e.eventDate < :now ORDER BY e.eventDate DESC")
    List<ClubEvent> findPastByClubId(Long clubId, LocalDateTime now);
}
