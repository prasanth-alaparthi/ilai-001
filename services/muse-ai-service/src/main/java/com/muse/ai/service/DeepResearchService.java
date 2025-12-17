package com.muse.ai.service;

import com.muse.ai.service.EmbeddingService.SemanticSearchResult;
import com.muse.ai.service.WebResearchService.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Deep Research Service - Phase 3
 * Synthesizes user notes + web sources into comprehensive answers with
 * citations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeepResearchService {

    private final EmbeddingService embeddingService;
    private final WebResearchService webResearchService;
    private final LLMRouterService llmRouterService;
    private final ResilientServiceClient serviceClient;

    /**
     * Perform deep research on a topic
     * 1. Search user's notes (RAG)
     * 2. Search web sources
     * 3. Synthesize with citations
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "researchFallback")
    public Mono<DeepResearchResult> research(String query, Long userId, ResearchOptions options) {
        log.info("Starting deep research for user {}: {}", userId, query);

        // Parallel fetch from all sources
        var noteSearch = searchUserNotes(query, userId, options.maxNotes());
        var webResearch = webResearchService.researchTopic(query);

        return Mono.zip(noteSearch, webResearch)
                .flatMap(tuple -> {
                    List<SemanticSearchResult> noteResults = tuple.getT1();
                    CombinedResearchResult webResults = tuple.getT2();

                    // Build context and citations
                    ResearchContext context = buildContext(noteResults, webResults);

                    // Synthesize with LLM
                    return synthesize(query, context, options);
                });
    }

    /**
     * Quick research - just notes + Wikipedia
     */
    public Mono<DeepResearchResult> quickResearch(String query, Long userId) {
        return research(query, userId, ResearchOptions.quick());
    }

    /**
     * Academic research - focus on arXiv papers
     */
    public Mono<DeepResearchResult> academicResearch(String query, Long userId) {
        return research(query, userId, ResearchOptions.academic());
    }

    // ============== Private Methods ==============

    private Mono<List<SemanticSearchResult>> searchUserNotes(String query, Long userId, int limit) {
        return embeddingService.searchSimilarWithThreshold(query, userId, 0.5, limit)
                .onErrorResume(e -> {
                    log.warn("Note search failed, continuing without notes: {}", e.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    private ResearchContext buildContext(List<SemanticSearchResult> notes,
            CombinedResearchResult web) {
        List<Citation> citations = new ArrayList<>();
        StringBuilder contextBuilder = new StringBuilder();
        int citationNum = 1;

        // Add user notes
        if (!notes.isEmpty()) {
            contextBuilder.append("## FROM YOUR NOTES:\n\n");
            for (SemanticSearchResult note : notes) {
                String citationId = "[" + citationNum + "]";
                contextBuilder.append(citationId).append(" ").append(note.chunkText())
                        .append("\n\n");
                citations.add(new Citation(
                        citationNum++,
                        "Your Notes",
                        note.chunkText().substring(0, Math.min(100, note.chunkText().length())) + "...",
                        "note:" + note.noteId(),
                        "note",
                        note.similarity()));
            }
        }

        // Add Wikipedia
        if (web.wikipedia() != null && !web.wikipedia().summary().isEmpty()) {
            String citationId = "[" + citationNum + "]";
            contextBuilder.append("## FROM WIKIPEDIA:\n\n")
                    .append(citationId).append(" ").append(web.wikipedia().summary())
                    .append("\n\n");
            citations.add(new Citation(
                    citationNum++,
                    web.wikipedia().title(),
                    web.wikipedia().summary(),
                    web.wikipedia().url(),
                    "wikipedia",
                    1.0));
        }

        // Add web results
        if (!web.webResults().isEmpty()) {
            contextBuilder.append("## FROM WEB SEARCH:\n\n");
            for (SearchResult result : web.webResults().stream().limit(3).toList()) {
                String citationId = "[" + citationNum + "]";
                contextBuilder.append(citationId).append(" ").append(result.snippet())
                        .append("\n\n");
                citations.add(new Citation(
                        citationNum++,
                        result.title(),
                        result.snippet(),
                        result.url(),
                        "web",
                        0.8));
            }
        }

        // Add academic papers
        if (!web.academicPapers().isEmpty()) {
            contextBuilder.append("## FROM ACADEMIC PAPERS:\n\n");
            for (ArxivPaper paper : web.academicPapers().stream().limit(3).toList()) {
                String citationId = "[" + citationNum + "]";
                contextBuilder.append(citationId).append(" ").append(paper.title())
                        .append(": ").append(paper.summary().substring(0,
                                Math.min(300, paper.summary().length())))
                        .append("...\n\n");
                citations.add(new Citation(
                        citationNum++,
                        paper.title(),
                        paper.summary(),
                        paper.arxivId(),
                        "arxiv",
                        0.9));
            }
        }

        return new ResearchContext(contextBuilder.toString(), citations);
    }

    private Mono<DeepResearchResult> synthesize(String query, ResearchContext context,
            ResearchOptions options) {
        String prompt = buildSynthesisPrompt(query, context, options);

        return llmRouterService.generateContent(prompt, buildSystemPrompt(options))
                .map(response -> {
                    // Parse the response to extract follow-up questions
                    String mainAnswer = response;
                    List<String> followUps = extractFollowUps(response);

                    if (!followUps.isEmpty()) {
                        // Remove follow-up section from main answer
                        int followUpIndex = response.indexOf("FOLLOW-UP");
                        if (followUpIndex > 0) {
                            mainAnswer = response.substring(0, followUpIndex).trim();
                        }
                    }

                    return new DeepResearchResult(
                            query,
                            mainAnswer,
                            context.citations(),
                            followUps,
                            determineConfidence(context),
                            options.depth().name());
                });
    }

    private String buildSynthesisPrompt(String query, ResearchContext context,
            ResearchOptions options) {
        return """
                RESEARCH QUERY: %s

                AVAILABLE SOURCES:
                %s

                INSTRUCTIONS:
                1. Answer the query comprehensively using the provided sources
                2. Use inline citations like [1], [2] to reference sources
                3. Prioritize user's notes as primary sources
                4. Synthesize information, don't just list facts
                5. If sources conflict, acknowledge the difference
                6. End with 2-3 follow-up questions for deeper learning

                FORMAT:
                [Your synthesized answer with [1][2] citations]

                FOLLOW-UP QUESTIONS:
                1. [question]
                2. [question]
                3. [question]
                """.formatted(query, context.contextText());
    }

    private String buildSystemPrompt(ResearchOptions options) {
        return switch (options.depth()) {
            case QUICK -> "You are a concise research assistant. Keep answers brief but accurate.";
            case DEEP -> "You are a thorough research assistant. Provide comprehensive, detailed answers.";
            case ACADEMIC ->
                "You are an academic research assistant. Use formal language and focus on scholarly sources.";
        };
    }

    private List<String> extractFollowUps(String response) {
        List<String> followUps = new ArrayList<>();
        String[] lines = response.split("\n");
        boolean inFollowUp = false;

        for (String line : lines) {
            if (line.contains("FOLLOW-UP") || line.contains("Follow-up")) {
                inFollowUp = true;
                continue;
            }
            if (inFollowUp && line.matches("^\\d+\\..*")) {
                followUps.add(line.replaceFirst("^\\d+\\.\\s*", "").trim());
            }
        }

        return followUps;
    }

    private double determineConfidence(ResearchContext context) {
        if (context.citations().isEmpty())
            return 0.3;

        long noteCount = context.citations().stream()
                .filter(c -> c.sourceType().equals("note")).count();
        long webCount = context.citations().stream()
                .filter(c -> !c.sourceType().equals("note")).count();

        // Higher confidence when user notes are included
        double baseConfidence = 0.5;
        if (noteCount > 0)
            baseConfidence += 0.2;
        if (webCount > 0)
            baseConfidence += 0.1;
        if (noteCount > 2)
            baseConfidence += 0.1;

        return Math.min(baseConfidence, 1.0);
    }

    private Mono<DeepResearchResult> researchFallback(String query, Long userId,
            ResearchOptions options, Throwable t) {
        log.warn("Research fallback for '{}': {}", query, t.getMessage());
        return Mono.just(new DeepResearchResult(
                query,
                "I'm currently unable to complete the research. Please try again in a moment.",
                Collections.emptyList(),
                List.of("What specific aspect of this topic interests you most?"),
                0.1,
                options.depth().name()));
    }

    // ============== Records ==============

    public record ResearchOptions(ResearchDepth depth, int maxNotes, boolean includeAcademic) {
        public static ResearchOptions quick() {
            return new ResearchOptions(ResearchDepth.QUICK, 3, false);
        }

        public static ResearchOptions deep() {
            return new ResearchOptions(ResearchDepth.DEEP, 5, true);
        }

        public static ResearchOptions academic() {
            return new ResearchOptions(ResearchDepth.ACADEMIC, 3, true);
        }
    }

    public enum ResearchDepth {
        QUICK, DEEP, ACADEMIC
    }

    public record ResearchContext(String contextText, List<Citation> citations) {
    }

    public record Citation(
            int number,
            String title,
            String snippet,
            String url,
            String sourceType,
            double relevance) {
    }

    public record DeepResearchResult(
            String query,
            String answer,
            List<Citation> citations,
            List<String> followUpQuestions,
            double confidence,
            String researchDepth) {
    }
}
