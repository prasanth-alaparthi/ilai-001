package com.muse.notes.journal.service;

import com.muse.notes.journal.entity.JournalEntry;
import com.muse.notes.journal.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JournalInsightService {

    private final JournalEntryRepository journalEntryRepository;

    public Map<String, Object> getInsights(Long userId, LocalDate startDate, LocalDate endDate) {
        List<JournalEntry> entries = journalEntryRepository.findByUserIdAndEntryDateBetween(userId, startDate, endDate);

        // In a real application, this would involve sending the content to an AI model.
        // For now, we'll perform a simple word count as a placeholder for AI analysis.
        String allContent = entries.stream()
                .map(entry -> String.join(" ", entry.getHighlights(), entry.getChallenges(), entry.getIntentions()))
                .collect(Collectors.joining(" "));

        long wordCount = Arrays.stream(allContent.split("\\s+")).count();

        return Map.of(
                "period", Map.of("start", startDate, "end", endDate),
                "totalEntries", entries.size(),
                "analysis", Map.of(
                        "summary", "AI-powered summary would go here.",
                        "commonThemes", List.of("Placeholder Theme 1", "Placeholder Theme 2"),
                        "wordCount", wordCount));
    }
}
