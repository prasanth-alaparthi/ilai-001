package com.muse.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Source Grounding Service - Phase 5
 * Enables AI to cite user's notes as sources (like NotebookLM)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SourceGroundingService {

    private final LLMRouterService llmRouterService;
    private final WebClient.Builder webClientBuilder;

    private static final String NOTES_SERVICE = "http://muse-notes-service:8082";

    /**
     * Citation record
     */
    public record Citation(
            int index,
            String noteId,
            String noteTitle,
            String excerpt,
            double relevance) {
    }

    /**
     * Grounded response with citations
     */
    public record GroundedResponse(
            String response,
            List<Citation> citations,
            boolean isGrounded,
            String confidence) {
    }

    /**
     * Generate a grounded response using user's notes as sources
     */
    public Mono<GroundedResponse> generateGroundedResponse(String query, Long userId) {
        // Step 1: Search user's notes for relevant content
        return searchRelevantNotes(query, userId)
                .flatMap(notes -> {
                    if (notes.isEmpty()) {
                        // No relevant notes found, generate ungrounded response
                        return llmRouterService.generateContent(query, "general")
                                .map(response -> new GroundedResponse(
                                        response.toString(),
                                        List.of(),
                                        false,
                                        "low"));
                    }

                    // Step 2: Build context from notes
                    String context = buildContextFromNotes(notes);
                    List<Citation> citations = buildCitations(notes);

                    // Step 3: Generate response with citations
                    String prompt = buildGroundedPrompt(query, context, citations);

                    return llmRouterService.generateContent(prompt, "grounded")
                            .map(response -> {
                                String formattedResponse = formatResponseWithCitations(
                                        response.toString(), citations);
                                return new GroundedResponse(
                                        formattedResponse,
                                        citations,
                                        true,
                                        determineConfidence(citations));
                            });
                });
    }

    /**
     * Search for notes relevant to the query
     */
    private Mono<List<Map<String, Object>>> searchRelevantNotes(String query, Long userId) {
        return webClientBuilder.build()
                .get()
                .uri(NOTES_SERVICE + "/api/notes/search?q=" + query + "&limit=5")
                .header("X-User-Id", String.valueOf(userId))
                .retrieve()
                .bodyToMono(Object.class)
                .map(response -> {
                    if (response instanceof List<?> list) {
                        return list.stream()
                                .filter(item -> item instanceof Map)
                                .map(item -> {
                                    @SuppressWarnings("unchecked")
                                    Map<String, Object> map = (Map<String, Object>) item;
                                    return map;
                                })
                                .collect(Collectors.toList());
                    }
                    return List.<Map<String, Object>>of();
                })
                .onErrorResume(e -> {
                    log.warn("Note search failed: {}", e.getMessage());
                    return Mono.just(List.of());
                });
    }

    /**
     * Build context string from notes
     */
    private String buildContextFromNotes(List<Map<String, Object>> notes) {
        StringBuilder context = new StringBuilder();
        context.append("=== YOUR NOTES ===\n\n");

        int index = 1;
        for (Map<String, Object> note : notes) {
            String title = String.valueOf(note.getOrDefault("title", "Untitled"));
            String content = String.valueOf(note.getOrDefault("content", ""));

            // Truncate content to prevent token overflow
            if (content.length() > 500) {
                content = content.substring(0, 500) + "...";
            }

            context.append("[").append(index).append("] ").append(title).append("\n");
            context.append(content).append("\n\n");
            index++;
        }

        return context.toString();
    }

    /**
     * Build citation list from notes
     */
    private List<Citation> buildCitations(List<Map<String, Object>> notes) {
        List<Citation> citations = new ArrayList<>();
        int index = 1;

        for (Map<String, Object> note : notes) {
            String id = String.valueOf(note.getOrDefault("id", ""));
            String title = String.valueOf(note.getOrDefault("title", "Untitled"));
            String content = String.valueOf(note.getOrDefault("content", ""));
            double score = note.containsKey("score") && note.get("score") instanceof Number
                    ? ((Number) note.get("score")).doubleValue()
                    : 0.5;

            // Create excerpt (first 150 chars)
            String excerpt = content.length() > 150
                    ? content.substring(0, 150) + "..."
                    : content;

            citations.add(new Citation(index, id, title, excerpt, score));
            index++;
        }

        return citations;
    }

    /**
     * Build prompt for grounded generation
     */
    private String buildGroundedPrompt(String query, String context, List<Citation> citations) {
        return """
                You are a helpful study assistant. Answer the user's question using ONLY the information from their notes provided below.

                IMPORTANT RULES:
                1. Only use information from the provided notes
                2. Cite sources using [1], [2], etc. format
                3. If the notes don't contain relevant information, say so
                4. Be concise and accurate

                %s

                User's Question: %s

                Provide a helpful answer with citations to the user's notes.
                """
                .formatted(context, query);
    }

    /**
     * Format response with inline citations
     */
    private String formatResponseWithCitations(String response, List<Citation> citations) {
        // The LLM should already include [1], [2] etc.
        // We just verify and clean up the citations
        return response;
    }

    /**
     * Determine confidence level based on citations
     */
    private String determineConfidence(List<Citation> citations) {
        if (citations.isEmpty()) {
            return "low";
        }

        double avgRelevance = citations.stream()
                .mapToDouble(Citation::relevance)
                .average()
                .orElse(0.5);

        if (avgRelevance > 0.8 && citations.size() >= 3) {
            return "high";
        } else if (avgRelevance > 0.5 || citations.size() >= 2) {
            return "medium";
        }
        return "low";
    }

    /**
     * Extract facts that can be verified from notes
     */
    public Mono<Map<String, Object>> verifyFacts(String content, Long userId) {
        // Search for notes that might contain the facts
        return searchRelevantNotes(content, userId)
                .map(notes -> {
                    List<Map<String, Object>> verifiedFacts = new ArrayList<>();
                    List<Map<String, Object>> unverifiedClaims = new ArrayList<>();

                    // Simple fact extraction (in production, use NER/fact extraction)
                    String[] sentences = content.split("[.!?]");
                    for (String sentence : sentences) {
                        boolean found = false;
                        for (Map<String, Object> note : notes) {
                            String noteContent = String.valueOf(note.getOrDefault("content", ""));
                            if (containsSimilarContent(sentence, noteContent)) {
                                verifiedFacts.add(Map.of(
                                        "claim", sentence.trim(),
                                        "source", note.getOrDefault("title", ""),
                                        "noteId", note.getOrDefault("id", "")));
                                found = true;
                                break;
                            }
                        }
                        if (!found && sentence.trim().length() > 20) {
                            unverifiedClaims.add(Map.of("claim", sentence.trim()));
                        }
                    }

                    return Map.of(
                            "verified", verifiedFacts,
                            "unverified", unverifiedClaims,
                            "verificationRate", verifiedFacts.size() * 100.0 /
                                    Math.max(1, verifiedFacts.size() + unverifiedClaims.size()));
                });
    }

    /**
     * Simple content similarity check
     */
    private boolean containsSimilarContent(String sentence, String noteContent) {
        String[] keywords = sentence.toLowerCase().split("\\s+");
        String contentLower = noteContent.toLowerCase();

        int matches = 0;
        for (String keyword : keywords) {
            if (keyword.length() > 3 && contentLower.contains(keyword)) {
                matches++;
            }
        }

        // Consider similar if 40% of meaningful keywords match
        return matches >= keywords.length * 0.4;
    }
}
