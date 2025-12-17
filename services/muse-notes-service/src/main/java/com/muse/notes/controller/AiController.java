package com.muse.notes.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.muse.notes.service.GeminiService;

@RestController
@RequestMapping("/api/ai")
@Slf4j
public class AiController extends BaseController {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    private boolean checkSubscription(Jwt jwt) {
        // TEMPORARY: Allow all users for testing/demo purposes
        return true;
        /*
         * if (jwt == null)
         * return false;
         * String plan = jwt.getClaimAsString("subscriptionPlan");
         * Boolean verified = jwt.getClaim("isStudentVerified");
         * 
         * // Allow if PREMIUM or INSTITUTIONAL, OR if verified student
         * // (Adjust logic as per business rules. Here assuming Verified Students get
         * AI)
         * boolean isPaid = "PREMIUM".equalsIgnoreCase(plan) ||
         * "INSTITUTIONAL".equalsIgnoreCase(plan);
         * boolean isVerifiedStudent = Boolean.TRUE.equals(verified);
         * 
         * return isPaid || isVerifiedStudent;
         */
    }

    // simple summarizer endpoint
    @PostMapping("/summarize")
    public Mono<ResponseEntity<Map<String, Object>>> summarize(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        log.debug("Received /summarize request");
        if (jwt == null) {
            log.debug("JWT is null");
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            log.debug("Subscription check failed");
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        log.debug("Summarizing content length: {}", content.length());
        String prompt = "Summarize the following note into a concise study summary suitable for quick revision (3-6 bullet points):\n\n"
                + content;
        return geminiService.generateContent(prompt)
                .map(response -> {
                    log.debug("Summary generated successfully");
                    return ResponseEntity.ok(Map.of("summary", (Object) response));
                })
                .onErrorResume(
                        e -> {
                            log.error("Error generating summary: {}", e.getMessage());
                            return Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage())));
                        });
    }

    @PostMapping("/explain")
    public Mono<ResponseEntity<Map<String, Object>>> explain(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        log.debug("Received /explain request");
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        String level = (String) body.getOrDefault("level", "easy");
        log.debug("Explaining content length: {}, level: {}", content.length(), level);
        String prompt = String.format(
                "Explain the following content in %s terms for a student preparing for an exam. Provide clear steps and key points:\n\n%s",
                level, content);
        return geminiService.generateContent(prompt)
                .map(response -> {
                    log.debug("Explanation generated successfully");
                    return ResponseEntity.ok(Map.of("explanation", (Object) response));
                })
                .onErrorResume(
                        e -> {
                            log.error("Error generating explanation: {}", e.getMessage());
                            return Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage())));
                        });
    }

    @PostMapping("/flashcards")
    public Mono<ResponseEntity<Map<String, Object>>> flashcards(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        log.debug("Received /flashcards request");
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        log.debug("Generating flashcards for content length: {}", content.length());
        String prompt = "From the following text, generate 8 concise flashcards in JSON array format [{\"q\":\"...\",\"a\":\"...\"}, ...]. Ensure each question is short and the answer is also concise. Return ONLY the JSON array, no other text:\n\n"
                + content;
        return geminiService.generateContent(prompt)
                .map(response -> {
                    try {
                        String jsonString = cleanJson(response);
                        Object json = objectMapper.readValue(jsonString, Object.class);
                        log.debug("Flashcards generated and parsed successfully");
                        return ResponseEntity.ok(Map.of("flashcardsJson", json));
                    } catch (Exception e) {
                        log.warn("Error parsing flashcards JSON: {}", e.getMessage());
                        return ResponseEntity.ok(Map.of("flashcardsJson", (Object) response));
                    }
                })
                .onErrorResume(
                        e -> {
                            log.error("Error generating flashcards: {}", e.getMessage());
                            return Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage())));
                        });
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> transcribe(@RequestPart("file") Mono<FilePart> filePartMono,
            Authentication auth) {
        return Mono.just(ResponseEntity.status(501)
                .body(Map.of("message", "Audio transcription is temporarily unavailable.")));
    }

    @PostMapping("/suggest-organization")
    public Mono<ResponseEntity<Map<String, Object>>> suggestOrganization(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        String prompt = "Analyze the following text and suggest an organization structure. Return a JSON object with two keys: 'suggestedNotebook' (a short, relevant notebook title) and 'suggestedTags' (an array of 3-5 relevant keyword tags). Return ONLY the JSON, no other text:\n\nText: "
                + content;

        return geminiService.generateContent(prompt)
                .map(response -> {
                    try {
                        String jsonString = cleanJson(response);
                        Object json = objectMapper.readValue(jsonString, Object.class);
                        return ResponseEntity.ok(Map.of("suggestions", json));
                    } catch (Exception e) {
                        return ResponseEntity.ok(Map.of("suggestions", (Object) response));
                    }
                })
                .onErrorResume(
                        e -> Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage()))));
    }

    @PostMapping("/generate-quiz")
    public Mono<ResponseEntity<Map<String, Object>>> generateQuiz(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        if (content.isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("message", "Content is required")));
        }

        String prompt = "Generate a multiple-choice quiz with 5 questions based on the following text. " +
                "Return a STRICT JSON array where each object has these exact keys: " +
                "'question' (string), 'options' (array of 4 strings), 'answer' (string, must match one of the options exactly), and 'explanation' (string, brief reason for the answer). "
                +
                "Do not include any markdown formatting or extra text. Return ONLY the JSON array:\n\n"
                + content;

        return geminiService.generateContent(prompt)
                .map(response -> {
                    try {
                        String jsonString = cleanJson(response);
                        Object json = objectMapper.readValue(jsonString, Object.class);
                        return ResponseEntity.ok(Map.of("quizJson", json));
                    } catch (Exception e) {
                        log.warn("Quiz JSON Parse Error: {} | Response: {}", e.getMessage(), response);
                        return ResponseEntity
                                .ok(Map.of("quizJson", (Object) response, "error", "Failed to parse quiz format"));
                    }
                })
                .onErrorResume(
                        e -> Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage()))));
    }

    private String cleanJson(String response) {
        // Remove markdown code blocks if present
        if (response.contains("```")) {
            return response.replaceAll("```json", "").replaceAll("```", "").trim();
        }
        return response.trim();
    }
}
