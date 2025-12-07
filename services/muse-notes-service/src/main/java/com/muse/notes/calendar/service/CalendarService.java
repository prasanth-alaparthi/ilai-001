package com.muse.notes.calendar.service;

import com.muse.notes.calendar.entity.CalendarEvent;
import com.muse.notes.calendar.repository.CalendarEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarEventRepository repository;

    public List<CalendarEvent> getEvents(String userId, Instant start, Instant end) {
        return repository.findByUserIdAndStartTimeBetween(userId, start, end);
    }

    public List<CalendarEvent> getUnscheduledEvents(String userId) {
        return repository.findByUserIdAndStartTimeIsNull(userId);
    }

    public CalendarEvent createEvent(String userId, CalendarEvent event) {
        event.setUserId(userId);
        return repository.save(event);
    }

    public CalendarEvent updateEvent(String userId, Long eventId, CalendarEvent updatedEvent) {
        CalendarEvent event = repository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        event.setTitle(updatedEvent.getTitle());
        event.setDescription(updatedEvent.getDescription());
        event.setStartTime(updatedEvent.getStartTime());
        event.setEndTime(updatedEvent.getEndTime());
        event.setAllDay(updatedEvent.isAllDay());
        event.setLocation(updatedEvent.getLocation());
        event.setType(updatedEvent.getType());
        event.setRecurrenceRule(updatedEvent.getRecurrenceRule());
        event.setStatus(updatedEvent.getStatus());
        event.setGroupId(updatedEvent.getGroupId());
        event.setStreakCount(updatedEvent.getStreakCount());

        return repository.save(event);
    }

    public void deleteEvent(String userId, Long eventId) {
        CalendarEvent event = repository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        repository.delete(event);
    }
}
