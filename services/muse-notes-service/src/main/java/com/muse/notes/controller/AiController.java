package com.muse.notes.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/ai")
public class AiController extends BaseController {

    private final WebClient webClient;
    private final String groqApiKey;
    // Using the versatile Llama 3.3 model which is currently active on Groq
    private final String groqModel = "llama-3.3-70b-versatile";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiController(
            @Value("${gemini.api.key}") String apiKey) { // We reuse the existing config key for simplicity
        // Base URL for Groq API (OpenAI compatible)
        this.webClient = WebClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
        this.groqApiKey = apiKey;
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
        System.out.println("Received /summarize request");
        if (jwt == null) {
            System.out.println("JWT is null");
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            System.out.println("Subscription check failed");
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        System.out.println("Summarizing content length: " + content.length());
        String prompt = "Summarize the following note into a concise study summary suitable for quick revision (3-6 bullet points):\n\n"
                + content;
        return callGroq(prompt)
                .map(response -> {
                    System.out.println("Summary generated successfully");
                    return ResponseEntity.ok(Map.of("summary", (Object) response));
                })
                .onErrorResume(
                        e -> {
                            System.err.println("Error generating summary: " + e.getMessage());
                            return Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage())));
                        });
    }

    @PostMapping("/explain")
    public Mono<ResponseEntity<Map<String, Object>>> explain(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        System.out.println("Received /explain request");
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        String level = (String) body.getOrDefault("level", "easy");
        System.out.println("Explaining content length: " + content.length() + ", level: " + level);
        String prompt = String.format(
                "Explain the following content in %s terms for a student preparing for an exam. Provide clear steps and key points:\n\n%s",
                level, content);
        return callGroq(prompt)
                .map(response -> {
                    System.out.println("Explanation generated successfully");
                    return ResponseEntity.ok(Map.of("explanation", (Object) response));
                })
                .onErrorResume(
                        e -> {
                            System.err.println("Error generating explanation: " + e.getMessage());
                            return Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage())));
                        });
    }

    @PostMapping("/flashcards")
    public Mono<ResponseEntity<Map<String, Object>>> flashcards(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        System.out.println("Received /flashcards request");
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
        }

        if (!checkSubscription(jwt)) {
            return Mono.just(ResponseEntity.status(403)
                    .body(Map.of("message", "AI features require a Premium subscription or Verified Student status.")));
        }

        String content = (String) body.getOrDefault("content", "");
        System.out.println("Generating flashcards for content length: " + content.length());
        String prompt = "From the following text, generate 8 concise flashcards in JSON array format [{\"q\":\"...\",\"a\":\"...\"}, ...]. Ensure each question is short and the answer is also concise. Return ONLY the JSON array, no other text:\n\n"
                + content;
        return callGroq(prompt)
                .map(response -> {
                    try {
                        String jsonString = cleanJson(response);
                        Object json = objectMapper.readValue(jsonString, Object.class);
                        System.out.println("Flashcards generated and parsed successfully");
                        return ResponseEntity.ok(Map.of("flashcardsJson", json));
                    } catch (Exception e) {
                        System.err.println("Error parsing flashcards JSON: " + e.getMessage());
                        return ResponseEntity.ok(Map.of("flashcardsJson", (Object) response));
                    }
                })
                .onErrorResume(
                        e -> {
                            System.err.println("Error generating flashcards: " + e.getMessage());
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

        return callGroq(prompt)
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

        return callGroq(prompt)
                .map(response -> {
                    try {
                        String jsonString = cleanJson(response);
                        Object json = objectMapper.readValue(jsonString, Object.class);
                        return ResponseEntity.ok(Map.of("quizJson", json));
                    } catch (Exception e) {
                        System.err.println("Quiz JSON Parse Error: " + e.getMessage() + " | Response: " + response);
                        return ResponseEntity
                                .ok(Map.of("quizJson", (Object) response, "error", "Failed to parse quiz format"));
                    }
                })
                .onErrorResume(
                        e -> Mono.just(ResponseEntity.status(500).body(Map.of("error", (Object) e.getMessage()))));
    }

    // Helper to call Groq API (OpenAI compatible)
    private Mono<String> callGroq(String prompt) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            System.err.println("Groq API Key is missing!");
            return Mono.error(new IllegalStateException("GROQ_API_KEY (gemini.api.key) not configured"));
        }

        System.out.println("Calling Groq API with model: " + groqModel);
        // System.out.println("Prompt: " + prompt); // Uncomment to debug prompt

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> req = Map.of(
                "model", groqModel,
                "messages", List.of(message),
                "temperature", 0.3 // Low temperature for more deterministic/factual results
        );

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + groqApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(resp -> {
                    try {
                        // Parse Groq/OpenAI response: choices[0].message.content
                        JsonNode choices = resp.path("choices");
                        if (choices.isArray() && choices.size() > 0) {
                            String content = choices.get(0).path("message").path("content").asText();
                            System.out.println("Groq API Response received (length: " + content.length() + ")");
                            return content;
                        } else {
                            System.err.println("Groq API Response invalid: " + resp.toPrettyString());
                        }
                    } catch (Exception e) {
                        System.err.println("Error parsing Groq response: " + e.getMessage());
                    }
                    return "";
                })
                .doOnError(e -> System.err.println("Groq API Call Failed: " + e.getMessage()))
                .timeout(Duration.ofSeconds(60));
    }

    private String cleanJson(String response) {
        // Remove markdown code blocks if present
        if (response.contains("```")) {
            return response.replaceAll("```json", "").replaceAll("```", "").trim();
        }
        return response.trim();
    }
}
