package com.muse.calendar.repository;

import com.muse.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByUserId(String userId);

    List<CalendarEvent> findByUserIdAndStartTimeBetween(String userId, Instant start, Instant end);

    List<CalendarEvent> findByUserIdAndStartTimeIsNull(String userId);
}
