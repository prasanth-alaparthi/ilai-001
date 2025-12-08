package com.muse.auth.ai.controller;

import com.muse.auth.ai.service.OpenAIIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.*;

/**
 * AI Writing Assistant Controller
 * Provides Grammarly-like features: grammar check, spelling check, sentence
 * improvement
 */
@RestController
@RequestMapping("/api/ai/writing")
public class AIWritingController {

    private final OpenAIIntegrationService openAIService;

    public AIWritingController(OpenAIIntegrationService openAIService) {
        this.openAIService = openAIService;
    }

    /**
     * Check grammar and return issues with suggestions
     * POST /api/ai/writing/grammar-check
     */
    @PostMapping("/grammar-check")
    public ResponseEntity<?> grammarCheck(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        if (!openAIService.enabled()) {
            // Return mock data when AI is not configured
            return ResponseEntity.ok(Map.of(
                    "issues", List.of(),
                    "message", "AI service not configured. Grammar check unavailable."));
        }

        try {
            String prompt = """
                    Analyze the following text for grammar issues. Return a JSON array of issues.
                    Each issue should have: "text" (the problematic text), "offset" (character position),
                    "length" (length of issue), "message" (explanation), "suggestions" (array of fixes).

                    Text to analyze:
                    """ + text
                    + """

                            Respond ONLY with valid JSON array. Example:
                            [{"text": "their", "offset": 45, "length": 5, "message": "Wrong word usage", "suggestions": ["there", "they're"]}]
                            """;

            String response = openAIService.summarize("gpt-3.5-turbo", prompt, 1000);

            // Parse response as JSON
            List<Map<String, Object>> issues = parseJsonArray(response);

            return ResponseEntity.ok(Map.of(
                    "issues", issues,
                    "text", text));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "issues", List.of(),
                    "error", "Failed to analyze grammar: " + e.getMessage()));
        }
    }

    /**
     * Check spelling and return errors with corrections
     * POST /api/ai/writing/spell-check
     */
    @PostMapping("/spell-check")
    public ResponseEntity<?> spellCheck(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        if (!openAIService.enabled()) {
            return ResponseEntity.ok(Map.of(
                    "errors", List.of(),
                    "message", "AI service not configured. Spell check unavailable."));
        }

        try {
            String prompt = """
                    Find spelling errors in the following text. Return a JSON array.
                    Each error should have: "word" (misspelled word), "offset" (position),
                    "suggestions" (array of correct spellings, max 3).

                    Text:
                    """ + text + """

                    Respond ONLY with valid JSON array. Example:
                    [{"word": "recieve", "offset": 23, "suggestions": ["receive"]}]
                    """;

            String response = openAIService.summarize("gpt-3.5-turbo", prompt, 500);
            List<Map<String, Object>> errors = parseJsonArray(response);

            return ResponseEntity.ok(Map.of(
                    "errors", errors,
                    "text", text));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "errors", List.of(),
                    "error", "Failed to check spelling: " + e.getMessage()));
        }
    }

    /**
     * Improve a sentence or paragraph
     * POST /api/ai/writing/improve
     */
    @PostMapping("/improve")
    public ResponseEntity<?> improveSentence(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        String style = payload.getOrDefault("style", "academic"); // academic, casual, formal, concise

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        if (!openAIService.enabled()) {
            return ResponseEntity.ok(Map.of(
                    "original", text,
                    "improved", text,
                    "message", "AI service not configured."));
        }

        try {
            String prompt = String.format("""
                    Improve the following text for %s writing style.
                    Make it clearer, more concise, and grammatically correct.
                    Maintain the original meaning.

                    Original text:
                    %s

                    Respond with ONLY the improved text, nothing else.
                    """, style, text);

            String improved = openAIService.summarize("gpt-3.5-turbo", prompt, 500);

            return ResponseEntity.ok(Map.of(
                    "original", text,
                    "improved", improved.trim(),
                    "style", style));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "original", text,
                    "improved", text,
                    "error", "Failed to improve text: " + e.getMessage()));
        }
    }

    /**
     * Get writing score and suggestions
     * POST /api/ai/writing/score
     */
    @PostMapping("/score")
    public ResponseEntity<?> writingScore(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        // Calculate basic metrics without AI
        int wordCount = text.split("\\s+").length;
        int sentenceCount = text.split("[.!?]+").length;
        double avgWordsPerSentence = sentenceCount > 0 ? (double) wordCount / sentenceCount : 0;

        // Basic readability score (simplified Flesch-Kincaid approximation)
        int syllableCount = countSyllables(text);
        double readabilityScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * ((double) syllableCount / wordCount);
        readabilityScore = Math.max(0, Math.min(100, readabilityScore));

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("wordCount", wordCount);
        metrics.put("sentenceCount", sentenceCount);
        metrics.put("avgWordsPerSentence", Math.round(avgWordsPerSentence * 10) / 10.0);
        metrics.put("readabilityScore", Math.round(readabilityScore));

        // Determine readability level
        String level;
        if (readabilityScore >= 90)
            level = "Very Easy";
        else if (readabilityScore >= 80)
            level = "Easy";
        else if (readabilityScore >= 70)
            level = "Fairly Easy";
        else if (readabilityScore >= 60)
            level = "Standard";
        else if (readabilityScore >= 50)
            level = "Fairly Difficult";
        else if (readabilityScore >= 30)
            level = "Difficult";
        else
            level = "Very Difficult";

        metrics.put("readabilityLevel", level);

        // Generate tips based on metrics
        List<String> tips = new ArrayList<>();
        if (avgWordsPerSentence > 25) {
            tips.add("Consider breaking up long sentences for better readability.");
        }
        if (wordCount < 50) {
            tips.add("Consider adding more detail to strengthen your argument.");
        }
        if (readabilityScore < 50) {
            tips.add("Use simpler words and shorter sentences to improve clarity.");
        }

        return ResponseEntity.ok(Map.of(
                "metrics", metrics,
                "tips", tips));
    }

    /**
     * Get writing suggestions (comprehensive analysis)
     * POST /api/ai/writing/suggestions
     */
    @PostMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        if (!openAIService.enabled()) {
            return ResponseEntity.ok(Map.of(
                    "suggestions", List.of(),
                    "message", "AI service not configured."));
        }

        try {
            String prompt = """
                    Analyze the following academic/scientific text and provide writing suggestions.
                    Return a JSON array with suggestions for improvement.
                    Each suggestion should have: "type" (clarity/conciseness/grammar/style/vocabulary),
                    "text" (the text being referred to), "suggestion" (what to improve),
                    "importance" (high/medium/low).

                    Text:
                    """ + text + """

                    Respond ONLY with valid JSON array. Limit to 5 most important suggestions.
                    """;

            String response = openAIService.summarize("gpt-3.5-turbo", prompt, 800);
            List<Map<String, Object>> suggestions = parseJsonArray(response);

            return ResponseEntity.ok(Map.of(
                    "suggestions", suggestions));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "suggestions", List.of(),
                    "error", "Failed to get suggestions: " + e.getMessage()));
        }
    }

    // Helper methods

    private List<Map<String, Object>> parseJsonArray(String response) {
        try {
            // Extract JSON array from response
            Pattern pattern = Pattern.compile("\\[.*\\]", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(response);
            if (matcher.find()) {
                String json = matcher.group();
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<>() {
                });
            }
        } catch (Exception e) {
            // Return empty list on parse failure
        }
        return List.of();
    }

    private int countSyllables(String text) {
        String[] words = text.toLowerCase().split("\\s+");
        int count = 0;
        for (String word : words) {
            count += countSyllablesInWord(word);
        }
        return Math.max(1, count);
    }

    private int countSyllablesInWord(String word) {
        word = word.replaceAll("[^a-z]", "");
        if (word.isEmpty())
            return 0;

        int count = 0;
        boolean prevVowel = false;

        for (char c : word.toCharArray()) {
            boolean isVowel = "aeiou".indexOf(c) >= 0;
            if (isVowel && !prevVowel) {
                count++;
            }
            prevVowel = isVowel;
        }

        // Adjust for silent e
        if (word.endsWith("e") && count > 1) {
            count--;
        }

        return Math.max(1, count);
    }
}
