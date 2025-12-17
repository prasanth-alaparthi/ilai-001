package com.muse.ai.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Study Guide Service - Phase 5
 * Generates comprehensive study guides from user's notes (like NotebookLM)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StudyGuideService {

    private final LLMRouterService llmRouterService;
    private final EmbeddingService embeddingService;
    private final ResilientServiceClient serviceClient;

    /**
     * Generate a comprehensive study guide from notes
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "studyGuideFallback")
    public Mono<StudyGuide> generateStudyGuide(Long userId, String topic, List<String> noteIds) {
        return fetchNotesContent(userId, noteIds)
                .flatMap(notesContent -> {
                    String prompt = buildStudyGuidePrompt(topic, notesContent);
                    return llmRouterService.generateContent(prompt, buildSystemPrompt())
                            .map(response -> parseStudyGuide(response, topic));
                });
    }

    /**
     * Generate key concepts from notes
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "keyConceptsFallback")
    public Mono<List<KeyConcept>> extractKeyConcepts(Long userId, String content) {
        String prompt = """
                Extract the key concepts from this content:

                %s

                For each concept provide:
                1. Term/Name
                2. Definition (1-2 sentences)
                3. Importance level (high/medium/low)
                4. Related terms

                Format as a numbered list.
                """.formatted(content);

        return llmRouterService.generateContent(prompt, "key_concepts")
                .map(this::parseKeyConcepts);
    }

    /**
     * Generate FAQ from notes
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "faqFallback")
    public Mono<List<FAQ>> generateFAQ(String content, int count) {
        String prompt = """
                Based on this content, generate %d frequently asked questions with answers:

                %s

                Format each as:
                Q: [question]
                A: [answer]

                Focus on questions a student might ask while studying this material.
                """.formatted(count, content);

        return llmRouterService.generateContent(prompt, "faq")
                .map(this::parseFAQs);
    }

    /**
     * Generate a briefing document (executive summary)
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "briefingFallback")
    public Mono<BriefingDocument> generateBriefing(Long userId, String title, List<String> noteIds) {
        return fetchNotesContent(userId, noteIds)
                .flatMap(notesContent -> {
                    String prompt = """
                            Create an executive briefing document for these notes:

                            %s

                            Include:
                            1. Executive Summary (2-3 paragraphs)
                            2. Key Takeaways (bullet points)
                            3. Important Terms (with definitions)
                            4. Action Items / Next Steps
                            5. Questions for Further Research

                            Format with clear headers.
                            """.formatted(notesContent);

                    return llmRouterService.generateContent(prompt, "briefing")
                            .map(response -> parseBriefing(response, title));
                });
    }

    /**
     * Generate a timeline from historical/sequential content
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "timelineFallback")
    public Mono<List<TimelineEvent>> generateTimeline(String content) {
        String prompt = """
                Extract a chronological timeline from this content:

                %s

                Format each event as:
                DATE: [date or period]
                EVENT: [what happened]
                SIGNIFICANCE: [why it matters]

                If dates are approximate, indicate with "circa" or "~".
                """.formatted(content);

        return llmRouterService.generateContent(prompt, "timeline")
                .map(this::parseTimeline);
    }

    // ============== Helper Methods ==============

    private Mono<String> fetchNotesContent(Long userId, List<String> noteIds) {
        // Use embedding service to get notes content or fallback
        if (noteIds == null || noteIds.isEmpty()) {
            return Mono.just("Please provide notes or content to analyze.");
        }

        // For now, return a placeholder - in production would call notes service
        // The content parameter in API call should contain the actual notes
        return Mono.just("Notes content will be provided by the caller.");
    }

    private String extractNotesContent(Object response) {
        if (response instanceof List<?> notes) {
            StringBuilder sb = new StringBuilder();
            for (Object note : notes) {
                if (note instanceof Map<?, ?> noteMap) {
                    Object title = noteMap.get("title");
                    Object content = noteMap.get("content");
                    sb.append("## ").append(title != null ? title.toString() : "Untitled").append("\n");
                    sb.append(content != null ? content.toString() : "").append("\n\n");
                }
            }
            return sb.toString();
        }
        return response != null ? response.toString() : "";
    }

    private String buildStudyGuidePrompt(String topic, String notesContent) {
        return """
                Create a comprehensive study guide for: %s

                Based on these notes:
                %s

                The study guide should include:

                ## 1. Overview
                - Brief introduction to the topic
                - Learning objectives

                ## 2. Key Concepts
                - List main concepts with explanations
                - Include examples where helpful

                ## 3. Important Definitions
                - Glossary of key terms

                ## 4. Summary Points
                - Bullet points of crucial information

                ## 5. Study Questions
                - Questions to test understanding

                ## 6. Common Misconceptions
                - Things students often get wrong

                ## 7. Connections
                - How this relates to other topics

                Format with clear markdown headers.
                """.formatted(topic, notesContent);
    }

    private String buildSystemPrompt() {
        return "You are an expert educator creating study materials. " +
                "Be clear, concise, and student-friendly.";
    }

    private StudyGuide parseStudyGuide(String response, String topic) {
        // Parse sections from response
        Map<String, String> sections = new LinkedHashMap<>();
        String[] parts = response.split("## ");

        for (String part : parts) {
            if (!part.isBlank()) {
                int newlineIdx = part.indexOf("\n");
                if (newlineIdx > 0) {
                    String header = part.substring(0, newlineIdx).trim();
                    String content = part.substring(newlineIdx).trim();
                    sections.put(header, content);
                }
            }
        }

        return new StudyGuide(topic, sections, response);
    }

    private List<KeyConcept> parseKeyConcepts(String response) {
        List<KeyConcept> concepts = new ArrayList<>();
        String[] lines = response.split("\n");

        String currentTerm = null;
        String currentDef = "";
        String importance = "medium";
        List<String> related = new ArrayList<>();

        for (String line : lines) {
            line = line.trim();
            if (line.matches("^\\d+\\..*")) {
                if (currentTerm != null) {
                    concepts.add(new KeyConcept(currentTerm, currentDef, importance, related));
                }
                currentTerm = line.replaceFirst("^\\d+\\.\\s*", "").split(":")[0].trim();
                if (line.contains(":")) {
                    currentDef = line.substring(line.indexOf(":") + 1).trim();
                }
                related = new ArrayList<>();
            }
        }

        if (currentTerm != null) {
            concepts.add(new KeyConcept(currentTerm, currentDef, importance, related));
        }

        return concepts;
    }

    private List<FAQ> parseFAQs(String response) {
        List<FAQ> faqs = new ArrayList<>();
        String[] parts = response.split("(?=Q:|Question:)");

        for (String part : parts) {
            if (part.contains("A:") || part.contains("Answer:")) {
                String question = part.split("A:|Answer:")[0]
                        .replace("Q:", "")
                        .replace("Question:", "")
                        .trim();
                String answer = part
                        .substring(part.indexOf("A:") > 0 ? part.indexOf("A:") + 2 : part.indexOf("Answer:") + 7)
                        .trim();
                if (!question.isEmpty() && !answer.isEmpty()) {
                    faqs.add(new FAQ(question, answer));
                }
            }
        }

        return faqs;
    }

    private BriefingDocument parseBriefing(String response, String title) {
        List<String> takeaways = new ArrayList<>();
        String summary = "";

        // Extract summary
        if (response.contains("Executive Summary")) {
            int start = response.indexOf("Executive Summary");
            int end = response.indexOf("##", start + 1);
            if (end > start) {
                summary = response.substring(start + 17, end).trim();
            }
        }

        // Extract takeaways
        if (response.contains("Key Takeaways")) {
            String section = response.substring(response.indexOf("Key Takeaways"));
            int end = section.indexOf("##", 1);
            if (end > 0)
                section = section.substring(0, end);

            for (String line : section.split("\n")) {
                if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
                    takeaways.add(line.trim().substring(1).trim());
                }
            }
        }

        return new BriefingDocument(title, summary, takeaways, response);
    }

    private List<TimelineEvent> parseTimeline(String response) {
        List<TimelineEvent> events = new ArrayList<>();
        String[] parts = response.split("(?=DATE:)");

        for (String part : parts) {
            if (part.contains("EVENT:")) {
                String date = extractField(part, "DATE:");
                String event = extractField(part, "EVENT:");
                String significance = extractField(part, "SIGNIFICANCE:");
                if (!date.isEmpty() && !event.isEmpty()) {
                    events.add(new TimelineEvent(date, event, significance));
                }
            }
        }

        return events;
    }

    private String extractField(String text, String field) {
        if (text.contains(field)) {
            int start = text.indexOf(field) + field.length();
            int end = text.indexOf("\n", start);
            if (end < 0)
                end = text.length();
            return text.substring(start, end).trim();
        }
        return "";
    }

    // ============== Fallback Methods ==============

    private Mono<StudyGuide> studyGuideFallback(Long userId, String topic,
            List<String> noteIds, Throwable t) {
        log.warn("Study guide fallback: {}", t.getMessage());
        return Mono.just(new StudyGuide(topic, Map.of(
                "Error", "Unable to generate study guide. Please try again."), ""));
    }

    private Mono<List<KeyConcept>> keyConceptsFallback(Long userId, String content, Throwable t) {
        log.warn("Key concepts fallback: {}", t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    private Mono<List<FAQ>> faqFallback(String content, int count, Throwable t) {
        log.warn("FAQ fallback: {}", t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    private Mono<BriefingDocument> briefingFallback(Long userId, String title,
            List<String> noteIds, Throwable t) {
        log.warn("Briefing fallback: {}", t.getMessage());
        return Mono.just(new BriefingDocument(title,
                "Unable to generate briefing", Collections.emptyList(), ""));
    }

    private Mono<List<TimelineEvent>> timelineFallback(String content, Throwable t) {
        log.warn("Timeline fallback: {}", t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    // ============== Records ==============

    public record StudyGuide(String topic, Map<String, String> sections, String fullContent) {
    }

    public record KeyConcept(String term, String definition, String importance, List<String> relatedTerms) {
    }

    public record FAQ(String question, String answer) {
    }

    public record BriefingDocument(String title, String summary, List<String> keyTakeaways, String fullContent) {
    }

    public record TimelineEvent(String date, String event, String significance) {
    }
}
