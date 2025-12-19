package com.muse.notes.journal.service;

import com.muse.notes.journal.entity.JournalEntry;
import com.muse.notes.journal.repository.JournalEntryRepository;
import com.muse.notes.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JournalInsightService {

        private final JournalEntryRepository journalEntryRepository;
        private final GeminiService geminiService;

        public Map<String, Object> getInsights(Long userId, LocalDate startDate, LocalDate endDate) {
                List<JournalEntry> entries = journalEntryRepository.findByUserIdAndEntryDateBetween(userId, startDate,
                                endDate);

                String allContent = entries.stream()
                                .map(entry -> String.join(" ", entry.getHighlights(), entry.getChallenges(),
                                                entry.getIntentions()))
                                .collect(Collectors.joining("\n\n"));

                if (allContent.length() < 50) {
                        return Map.of(
                                        "period", Map.of("start", startDate, "end", endDate),
                                        "totalEntries", entries.size(),
                                        "analysis", Map.of(
                                                        "summary", "Not enough content to analyze.",
                                                        "commonThemes", List.of(),
                                                        "wordCount", 0));
                }

                try {
                        String prompt = """
                                        Analyze the following journal entries and provide:
                                        1. A brief 2-3 sentence summary of the overall themes
                                        2. Top 3-5 common themes or patterns
                                        3. Mood trends if detectable
                                        4. One actionable suggestion

                                        Journal entries:
                                        """ + allContent;

                        String aiResponse = geminiService.generateContent(prompt).block();
                        long wordCount = allContent.split("\\s+").length;

                        return Map.of(
                                        "period", Map.of("start", startDate, "end", endDate),
                                        "totalEntries", entries.size(),
                                        "analysis", Map.of(
                                                        "summary", aiResponse,
                                                        "wordCount", wordCount));

                } catch (Exception e) {
                        log.error("Failed to generate journal insights", e);
                        long wordCount = allContent.split("\\s+").length;
                        return Map.of(
                                        "period", Map.of("start", startDate, "end", endDate),
                                        "totalEntries", entries.size(),
                                        "analysis", Map.of(
                                                        "summary", "AI analysis temporarily unavailable.",
                                                        "error", e.getMessage(),
                                                        "wordCount", wordCount));
                }
        }
}
