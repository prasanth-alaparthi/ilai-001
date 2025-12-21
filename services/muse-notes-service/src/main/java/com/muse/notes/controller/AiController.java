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
import java.util.HashMap;
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

    @PostMapping("/summarize")
    public Mono<ResponseEntity<Map<String, Object>>> summarize(@RequestBody Map<String, Object> body,
            Authentication auth) {
        log.debug("Received /summarize request");
        Long userId = currentUserId(auth);
        if (userId == null) {
            log.debug("UserId is null");
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        // We can still pass the JWT if needed for subscription check,
        // or just pass the userId if subscription is checked elsewhere.
        // For now, let's just make it consistent with Authentication.

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
            Authentication auth) {
        log.debug("Received /explain request");
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
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
            Authentication auth) {
        log.debug("Received /flashcards request");
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
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
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
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
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
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

    @PostMapping("/study-guide")
    public Mono<ResponseEntity<Map<String, Object>>> studyGuide(@RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null)
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        String content = (String) body.getOrDefault("content", "");
        String topic = (String) body.getOrDefault("topic", "General");
        String prompt = String.format(
                "Create a comprehensive Study Guide for '%s' based on this content. Structure it with sections like 'Introduction', 'Core Concepts', 'Detailed Breakdown', and 'Summary'. Return a JSON object with a 'topic' key and a 'sections' key (map of title to text content):\n\n%s",
                topic, content);

        return geminiService.generateContent(prompt).map(res -> {
            try {
                return ResponseEntity.ok(objectMapper.readValue(cleanJson(res), Map.class));
            } catch (Exception e) {
                return ResponseEntity.ok(Map.of("topic", topic, "fullContent", res));
            }
        });
    }

    @PostMapping("/key-concepts")
    public Mono<ResponseEntity<Object>> keyConcepts(@RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null)
            return Mono.just(ResponseEntity.status(401).build());
        String content = (String) body.getOrDefault("content", "");
        String prompt = "Extract the key concepts from the following text. Return a JSON array of objects, each with 'term' (string), 'definition' (string), 'importance' (one of: 'high', 'medium', 'low'), and 'relatedTerms' (array of strings):\n\n"
                + content;

        return geminiService.generateContent(prompt).map(res -> {
            try {
                return ResponseEntity.ok(objectMapper.readValue(cleanJson(res), Object.class));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Failed to parse concepts JSON: " + res);
            }
        });
    }

    @PostMapping("/mind-map")
    public Mono<ResponseEntity<Object>> mindMap(@RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null)
            return Mono.just(ResponseEntity.status(401).build());
        String content = (String) body.getOrDefault("content", "");
        String topic = (String) body.getOrDefault("centralTopic", "Core Idea");
        String prompt = String.format(
                "Convert the following text into a Mind Map structure. Return a JSON object with: 'central' (object with 'label'), and 'branches' (array of objects with 'label' and 'children' array of objects with 'label'). Focus on hierarchy.\n\nContent:\n%s",
                content);

        return geminiService.generateContent(prompt).map(res -> {
            try {
                return ResponseEntity.ok(objectMapper.readValue(cleanJson(res), Object.class));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Failed to parse mind-map JSON: " + res);
            }
        });
    }

    @PostMapping("/podcast-script")
    public Mono<ResponseEntity<Object>> podcastScript(@RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null)
            return Mono.just(ResponseEntity.status(401).build());
        String content = (String) body.getOrDefault("content", "");
        String topic = (String) body.getOrDefault("topic", "Discussion");
        String prompt = String.format(
                "Write a 3-minute casual educational podcast script between two hosts (Alex and Jamie) discussing the following content. Return a JSON object with 'topic', 'estimatedSeconds', and 'dialogue' (array of objects with 'speaker' and 'text'):\n\n%s",
                content);

        return geminiService.generateContent(prompt).map(res -> {
            try {
                return ResponseEntity.ok(objectMapper.readValue(cleanJson(res), Object.class));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Failed to parse podcast JSON: " + res);
            }
        });
    }

    @PostMapping("/timeline")
    public Mono<ResponseEntity<Object>> timeline(@RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null)
            return Mono.just(ResponseEntity.status(401).build());
        String content = (String) body.getOrDefault("content", "");
        String prompt = "Extract chronological events from the text. Return a JSON array of objects with 'date' (string), 'event' (string), and 'significance' (string):\n\n"
                + content;

        return geminiService.generateContent(prompt).map(res -> {
            try {
                return ResponseEntity.ok(objectMapper.readValue(cleanJson(res), Object.class));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Failed to parse timeline JSON: " + res);
            }
        });
    }

    @PostMapping("/faq")
    public Mono<ResponseEntity<Object>> faq(@RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null)
            return Mono.just(ResponseEntity.status(401).build());
        String content = (String) body.getOrDefault("content", "");
        int count = (int) body.getOrDefault("count", 5);
        String prompt = String.format(
                "Generate %d deep-dive FAQs based on the following text. Return a JSON array of objects with 'question' and 'answer':\n\n%s",
                count, content);

        return geminiService.generateContent(prompt).map(res -> {
            try {
                return ResponseEntity.ok(objectMapper.readValue(cleanJson(res), Object.class));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Failed to parse faq JSON: " + res);
            }
        });
    }

    @GetMapping("/tts")
    public Mono<ResponseEntity<Map<String, Object>>> textToSpeech(
            @RequestParam String text,
            @RequestParam(defaultValue = "en-US") String lang,
            Authentication auth) {
        Long userId = currentUserId(auth);
        if (userId == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        // Limit text length for TTS
        String truncatedText = text.length() > 5000 ? text.substring(0, 5000) : text;

        log.info("TTS request for {} characters", truncatedText.length());

        return geminiService.textToSpeech(truncatedText, lang)
                .map(audioBase64 -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("audio", audioBase64);
                    response.put("format", "mp3");
                    response.put("lang", lang);
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(e -> {
                    log.error("TTS generation failed: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(500)
                            .body(Map.of("error", "TTS generation failed: " + e.getMessage())));
                });
    }

    @PostMapping("/tts")
    public Mono<ResponseEntity<Map<String, Object>>> textToSpeechPost(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        String content = (String) body.getOrDefault("content", "");
        String lang = (String) body.getOrDefault("lang", "en-US");

        if (content == null || content.isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("message", "Content is required")));
        }
        return textToSpeech(content, lang, auth);
    }

    private String cleanJson(String response) {
        // Remove markdown code blocks if present
        if (response.contains("```")) {
            return response.replaceAll("```json", "").replaceAll("```", "").trim();
        }
        return response.trim();
    }
}
