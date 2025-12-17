package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Doubt Solver Service - AI-powered question answering with citations
 * 
 * Features:
 * - Answer academic questions with source citations
 * - Support for multiple subjects (Math, Science, History, etc.)
 * - Grounding responses in user's notes (when available)
 * - NCERT/CBSE curriculum alignment for Indian students
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DoubtSolverService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash-001}")
    private String geminiModel;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    /**
     * Solve a doubt/question with detailed explanation and citations
     */
    public Map<String, Object> solveDoubt(String question, String subject, List<String> noteContexts, Long userId) {
        log.info("Solving doubt for user {}: {} (subject: {})", userId,
                question.substring(0, Math.min(50, question.length())), subject);

        String systemPrompt = buildSystemPrompt(subject);
        String userPrompt = buildUserPrompt(question, noteContexts);

        try {
            String response = callGemini(systemPrompt, userPrompt);
            return parseDoubtResponse(response, question, subject);
        } catch (Exception e) {
            log.error("Error solving doubt: {}", e.getMessage(), e);
            return Map.of(
                    "success", false,
                    "error", "Failed to process your question. Please try again.",
                    "question", question);
        }
    }

    private String buildSystemPrompt(String subject) {
        String subjectContext = switch (subject != null ? subject.toLowerCase() : "general") {
            case "math", "mathematics" -> """
                    You are an expert mathematics tutor specializing in Indian curriculum (CBSE/ICSE).
                    Explain concepts step-by-step with clear mathematical notation.
                    Use examples relevant to Indian students.
                    """;
            case "physics" -> """
                    You are an expert physics teacher aligned with NCERT curriculum.
                    Explain with real-world examples, formulas, and diagrams descriptions.
                    Include SI units and numerical examples.
                    """;
            case "chemistry" -> """
                    You are an expert chemistry teacher following NCERT syllabus.
                    Explain reactions, mechanisms, and concepts clearly.
                    Include molecular formulas and equations.
                    """;
            case "biology" -> """
                    You are an expert biology teacher following NCERT curriculum.
                    Explain with diagrams, processes, and real-life applications.
                    """;
            case "history" -> """
                    You are an expert history teacher with focus on Indian and World history.
                    Provide context, dates, and cause-effect relationships.
                    """;
            default -> """
                    You are an expert academic tutor helping Indian students.
                    Provide clear, detailed explanations suitable for school/college level.
                    """;
        };

        return subjectContext + """

                RESPONSE FORMAT:
                1. Start with a brief SUMMARY (2-3 sentences)
                2. Provide DETAILED EXPLANATION with step-by-step reasoning
                3. Include EXAMPLES where helpful
                4. Add IMPORTANT POINTS to remember
                5. If applicable, mention COMMON MISTAKES to avoid
                6. End with SOURCES/REFERENCES (textbook chapters, NCERT pages, etc.)

                Use markdown formatting for clarity.
                When citing sources, use format: [Source: NCERT Class X Chapter Y] or [Source: Topic Name]
                """;
    }

    private String buildUserPrompt(String question, List<String> noteContexts) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("QUESTION: ").append(question).append("\n\n");

        if (noteContexts != null && !noteContexts.isEmpty()) {
            prompt.append("STUDENT'S NOTES FOR CONTEXT:\n");
            for (int i = 0; i < noteContexts.size(); i++) {
                prompt.append("--- Note ").append(i + 1).append(" ---\n");
                prompt.append(noteContexts.get(i)).append("\n\n");
            }
            prompt.append(
                    "Use the student's notes to provide relevant context, but also add information beyond what's in the notes.\n");
        }

        return prompt.toString();
    }

    private String callGemini(String systemPrompt, String userPrompt) {
        String url = String.format(GEMINI_URL, geminiModel, geminiApiKey);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("text", systemPrompt + "\n\n" + userPrompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 2048));

        String response = webClient.post()
                .uri(url)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (Exception e) {
            log.error("Failed to parse Gemini response", e);
            throw new RuntimeException("Failed to parse AI response");
        }
    }

    private Map<String, Object> parseDoubtResponse(String response, String question, String subject) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("question", question);
        result.put("subject", subject);
        result.put("answer", response);
        result.put("timestamp", Instant.now().toString());

        // Extract citations from response
        List<Map<String, String>> citations = extractCitations(response);
        result.put("citations", citations);

        // Extract sections
        Map<String, String> sections = extractSections(response);
        result.put("sections", sections);

        return result;
    }

    /**
     * Extract citations from the response
     */
    private List<Map<String, String>> extractCitations(String response) {
        List<Map<String, String>> citations = new ArrayList<>();

        // Pattern to match [Source: ...] citations
        Pattern pattern = Pattern.compile("\\[Source:\\s*([^\\]]+)\\]");
        Matcher matcher = pattern.matcher(response);

        Set<String> seen = new HashSet<>();
        while (matcher.find()) {
            String source = matcher.group(1).trim();
            if (!seen.contains(source)) {
                citations.add(Map.of(
                        "source", source,
                        "type", inferSourceType(source)));
                seen.add(source);
            }
        }

        // Also check for NCERT references
        Pattern ncertPattern = Pattern.compile("NCERT\\s+Class\\s+(\\d+|[IVX]+)\\s+Chapter\\s+(\\d+|[^,\\]]+)",
                Pattern.CASE_INSENSITIVE);
        Matcher ncertMatcher = ncertPattern.matcher(response);
        while (ncertMatcher.find()) {
            String source = ncertMatcher.group(0);
            if (!seen.contains(source)) {
                citations.add(Map.of(
                        "source", source,
                        "type", "textbook"));
                seen.add(source);
            }
        }

        return citations;
    }

    private String inferSourceType(String source) {
        String lower = source.toLowerCase();
        if (lower.contains("ncert") || lower.contains("chapter") || lower.contains("textbook")) {
            return "textbook";
        } else if (lower.contains("wikipedia") || lower.contains("britannica")) {
            return "encyclopedia";
        } else if (lower.contains("theorem") || lower.contains("law")) {
            return "concept";
        }
        return "reference";
    }

    /**
     * Extract sections from formatted response
     */
    private Map<String, String> extractSections(String response) {
        Map<String, String> sections = new LinkedHashMap<>();

        String[] sectionNames = { "SUMMARY", "DETAILED EXPLANATION", "EXAMPLES", "IMPORTANT POINTS", "COMMON MISTAKES",
                "SOURCES" };

        for (int i = 0; i < sectionNames.length; i++) {
            String sectionName = sectionNames[i];
            int start = response.toUpperCase().indexOf(sectionName);
            if (start != -1) {
                int end = response.length();
                // Find the next section
                for (int j = i + 1; j < sectionNames.length; j++) {
                    int nextStart = response.toUpperCase().indexOf(sectionNames[j]);
                    if (nextStart != -1 && nextStart > start) {
                        end = nextStart;
                        break;
                    }
                }
                String content = response.substring(start + sectionName.length(), end).trim();
                // Remove leading colons or dashes
                content = content.replaceFirst("^[:\\-\\s]+", "").trim();
                sections.put(sectionName.toLowerCase().replace(" ", "_"), content);
            }
        }

        return sections;
    }

    /**
     * Get subject suggestions based on question
     */
    public String detectSubject(String question) {
        String lower = question.toLowerCase();

        if (containsAny(lower, "equation", "formula", "solve", "calculate", "algebra", "geometry", "trigonometry",
                "calculus")) {
            return "mathematics";
        } else if (containsAny(lower, "force", "velocity", "acceleration", "energy", "newton", "electric",
                "magnetic")) {
            return "physics";
        } else if (containsAny(lower, "element", "compound", "reaction", "atom", "molecule", "acid", "base",
                "organic")) {
            return "chemistry";
        } else if (containsAny(lower, "cell", "organism", "dna", "gene", "evolution", "ecosystem", "photosynthesis")) {
            return "biology";
        } else if (containsAny(lower, "war", "empire", "dynasty", "freedom", "independence", "revolution", "ancient")) {
            return "history";
        }

        return "general";
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword))
                return true;
        }
        return false;
    }

    /**
     * Generate follow-up questions based on the answered doubt
     */
    public List<String> generateFollowUpQuestions(String question, String answer) {
        String prompt = """
                Based on this Q&A, suggest 3 related follow-up questions a student might ask:

                Question: %s

                Answer Summary: %s

                Return ONLY the 3 questions, one per line, no numbering.
                """.formatted(question, answer.substring(0, Math.min(500, answer.length())));

        try {
            String response = callGemini("You are an educational AI.", prompt);
            return Arrays.stream(response.split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && s.endsWith("?"))
                    .limit(3)
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to generate follow-up questions: {}", e.getMessage());
            return List.of();
        }
    }
}
