package com.muse.notes.journal.service;

import com.muse.notes.journal.entity.*;
import com.muse.notes.journal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    private final MoodEntryRepository moodEntryRepository;
    private final JournalAudioRepository journalAudioRepository;
    private final JournalTranscriptRepository journalTranscriptRepository;
    private final JournalReminderRepository journalReminderRepository;
    private final SharedJournalRepository sharedJournalRepository;

    @Cacheable(value = "journal_entries", key = "#userId + '_' + #date")
    public Optional<JournalEntry> getJournalEntry(Long userId, LocalDate date) {
        return journalEntryRepository.findByUserIdAndEntryDateAndDeletedAtIsNull(userId, date);
    }

    @Caching(evict = {
            @CacheEvict(value = "journal_entries", key = "#userId + '_' + #date"),
            @CacheEvict(value = "journal_months", key = "#userId + '_' + #date.year + '_' + #date.monthValue")
    })
    public JournalEntry saveJournalEntry(Long userId, LocalDate date, String highlights, String challenges,
            String intentions) {
        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDateAndDeletedAtIsNull(userId, date)
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

    @Cacheable(value = "journal_months", key = "#userId + '_' + #year + '_' + #month")
    public List<JournalEntry> getEntriesForMonth(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        return journalEntryRepository.findByUserIdAndEntryDateBetweenAndDeletedAtIsNull(userId, startDate, endDate);
    }

    public List<JournalEntry> listUserEntries(Long userId) {
        return journalEntryRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    // --- Trash Support ---

    @Caching(evict = {
            @CacheEvict(value = "journal_entries", allEntries = true),
            @CacheEvict(value = "journal_months", allEntries = true)
    })
    public void moveToTrash(Long id, Long userId) {
        journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .ifPresent(entry -> {
                    entry.setDeletedAt(Instant.now());
                    journalEntryRepository.save(entry);
                });
    }

    @Caching(evict = {
            @CacheEvict(value = "journal_entries", allEntries = true),
            @CacheEvict(value = "journal_months", allEntries = true)
    })
    public void restoreFromTrash(Long id, Long userId) {
        journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .ifPresent(entry -> {
                    entry.setDeletedAt(null);
                    journalEntryRepository.save(entry);
                });
    }

    public List<JournalEntry> getTrash(Long userId) {
        return journalEntryRepository.findByUserIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(userId);
    }

    @Transactional
    public void emptyTrash(Long userId) {
        List<JournalEntry> trashed = journalEntryRepository
                .findByUserIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(userId);
        for (JournalEntry entry : trashed) {
            deleteJournalEntryInternal(entry.getId(), userId);
        }
    }

    @Transactional
    public void deleteJournalEntry(Long id, Long userId) {
        deleteJournalEntryInternal(id, userId);
    }

    private void deleteJournalEntryInternal(Long id, Long userId) {
        journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .ifPresent(entry -> {
                    // Cascade Cleanup
                    journalAudioRepository.deleteByJournalId(id);
                    journalTranscriptRepository.deleteByJournalId(id);
                    journalReminderRepository.deleteByJournalId(id);
                    moodEntryRepository.deleteByJournalId(id);
                    sharedJournalRepository.deleteByJournalId(id);
                    submissionRepository.deleteByEntryId(id);
                    publicationRepository.deleteByEntryId(id);

                    // Cleanup date-linked entities
                    moodRepository.deleteByUserIdAndEntryDate(userId, entry.getEntryDate());
                    gratitudeRepository.deleteByUserIdAndEntryDate(userId, entry.getEntryDate());

                    journalEntryRepository.delete(entry);
                });
    }

    // --- Tagging & Search ---

    public void updateTags(Long id, Long userId, String[] tags) {
        journalEntryRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .ifPresent(entry -> {
                    entry.setTags(tags);
                    journalEntryRepository.save(entry);
                });
    }

    public List<JournalEntry> getEntriesByTag(Long userId, String tag) {
        return journalEntryRepository.findByUserIdAndTag(userId, tag);
    }

    public List<JournalEntry> search(Long userId, String query) {
        return journalEntryRepository.search(userId, query);
    }

    /**
     * Semantic search using AI embeddings
     * Falls back to text search if embedding generation fails
     */
    public List<JournalEntry> semanticSearch(Long userId, String query, int limit) {
        try {
            // Generate embedding for query (using EmbeddingService if available)
            // For now, use text search as embeddings require EmbeddingService injection
            // Full implementation would:
            // float[] queryEmbedding = embeddingService.generateEmbedding(query);
            // String embeddingString = Arrays.toString(queryEmbedding);
            // return journalEntryRepository.searchByEmbedding(userId, embeddingString,
            // limit);

            // Log that we're using text search fallback
            // Full semantic search requires EmbeddingService to be injected
            return journalEntryRepository.search(userId, query);
        } catch (Exception e) {
            return journalEntryRepository.search(userId, query);
        }
    }

    // --- Publication & Review ---

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
