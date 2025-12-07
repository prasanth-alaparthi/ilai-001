package com.muse.journal.service;

import com.muse.journal.entity.*;
import com.muse.journal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final MoodRepository moodRepository;
    private final GratitudeRepository gratitudeRepository;

    private final PublicationRepository publicationRepository;
    private final SubmissionRepository submissionRepository;

    public Optional<JournalEntry> getJournalEntry(Long userId, LocalDate date) {
        return journalEntryRepository.findByUserIdAndEntryDate(userId, date);
    }

    public JournalEntry saveJournalEntry(Long userId, LocalDate date, String highlights, String challenges,
            String intentions) {
        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDate(userId, date)
                .orElse(new JournalEntry());

        entry.setUserId(userId);
        entry.setEntryDate(date);
        entry.setHighlights(highlights);
        entry.setChallenges(challenges);
        entry.setIntentions(intentions);

        return journalEntryRepository.save(entry);
    }

    public Optional<Mood> getMood(Long userId, LocalDate date) {
        return moodRepository.findByUserIdAndEntryDate(userId, date);
    }

    public Mood saveMood(Long userId, LocalDate date, String moodType, String notes) {
        Mood mood = moodRepository.findByUserIdAndEntryDate(userId, date)
                .orElse(new Mood());

        mood.setUserId(userId);
        mood.setEntryDate(date);
        mood.setMoodType(moodType);
        mood.setNotes(notes);

        return moodRepository.save(mood);
    }

    public List<Gratitude> getGratitudes(Long userId, LocalDate date) {
        return gratitudeRepository.findByUserIdAndEntryDate(userId, date);
    }

    public Gratitude addGratitude(Long userId, LocalDate date, String content) {
        Gratitude gratitude = Gratitude.builder()
                .userId(userId)
                .entryDate(date)
                .content(content)
                .build();
        return gratitudeRepository.save(gratitude);
    }

    public void deleteGratitude(Long gratitudeId, Long userId) {
        gratitudeRepository.findById(gratitudeId)
                .filter(gratitude -> gratitude.getUserId().equals(userId))
                .ifPresent(gratitudeRepository::delete);
    }

    public List<JournalEntry> getEntriesForMonth(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        return journalEntryRepository.findByUserIdAndEntryDateBetween(userId, startDate, endDate);
    }

    public List<Publication> listPublicationsForCourse(String courseCode) {
        return publicationRepository.findByCourseCodeOrderByPublishedAtDesc(courseCode);
    }

    public List<Submission> listSubmissionsForCourseQueue(String courseCode) {
        return submissionRepository.findByCourseCodeAndStatusOrderBySubmittedAtAsc(courseCode, ReviewStatus.SUBMITTED);
    }

    public Optional<Submission> applyReviewDecision(Long submissionId, String reviewerUsername, ReviewStatus status,
            String comments) {
        return submissionRepository.findById(submissionId).map(submission -> {
            submission.setStatus(status);
            submission.setReviewerUsername(reviewerUsername);
            submission.setReviewerComments(comments);
            submission.setReviewedAt(Instant.now());
            Submission saved = submissionRepository.save(submission);

            if (status == ReviewStatus.ACCEPTED) {
                // Auto-publish if accepted
                Publication pub = new Publication();
                pub.setEntryId(saved.getEntryId());
                pub.setSubmissionId(saved.getId());
                pub.setCourseCode(saved.getCourseCode());
                pub.setPublishedByUsername(reviewerUsername);
                pub.setPublishedAt(Instant.now());
                publicationRepository.save(pub);
            }
            return saved;
        });
    }
}
