package com.muse.ai.controller;

import com.muse.ai.service.LLMRouterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * AI Controller
 * Provides AI endpoints that other services can call.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

        private final LLMRouterService llmRouterService;

        /**
         * Summarize content
         */
        @PostMapping("/summarize")
        public Mono<ResponseEntity<Map<String, String>>> summarize(@RequestBody Map<String, String> request) {
                String content = request.get("content");
                return llmRouterService.summarize(content)
                                .map(summary -> ResponseEntity.ok(Map.of("summary", summary)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Explain content at a specific level
         */
        @PostMapping("/explain")
        public Mono<ResponseEntity<Map<String, String>>> explain(@RequestBody Map<String, String> request) {
                String content = request.get("content");
                String level = request.getOrDefault("level", "easy");
                return llmRouterService.explain(content, level)
                                .map(explanation -> ResponseEntity.ok(Map.of("explanation", explanation)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Generate flashcards
         */
        @PostMapping("/flashcards")
        public Mono<ResponseEntity<Map<String, String>>> flashcards(@RequestBody Map<String, String> request) {
                String content = request.get("content");
                return llmRouterService.generateFlashcards(content)
                                .map(result -> ResponseEntity.ok(Map.of("flashcards", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Generate quiz
         */
        @PostMapping("/generate-quiz")
        public Mono<ResponseEntity<Map<String, String>>> generateQuiz(@RequestBody Map<String, String> request) {
                String content = request.get("content");
                return llmRouterService.generateQuiz(content)
                                .map(result -> ResponseEntity.ok(Map.of("quiz", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Suggest organization for notes
         */
        @PostMapping("/suggest-organization")
        public Mono<ResponseEntity<Map<String, String>>> suggestOrganization(@RequestBody Map<String, String> request) {
                String content = request.get("content");
                String prompt = """
                                Analyze the following content and suggest how to organize it into sections, headings, and sub-topics.
                                Return as JSON: {"sections": [{"title": "...", "content": "..."}], "tags": ["..."], "summary": "..."}

                                Content:
                                """
                                + content;
                return llmRouterService.generateContent(prompt, null)
                                .map(result -> ResponseEntity.ok(Map.of("organization", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Transcribe audio (placeholder - requires audio processing)
         */
        @PostMapping("/transcribe")
        public ResponseEntity<Map<String, String>> transcribe() {
                // TODO: Implement audio transcription with Whisper
                return ResponseEntity.ok(Map.of(
                                "message", "Transcription feature coming soon. Use client-side Whisper.js for now.",
                                "text", ""));
        }

        /**
         * General content generation
         */
        @PostMapping("/generate")
        public Mono<ResponseEntity<Map<String, String>>> generate(@RequestBody Map<String, String> request) {
                String prompt = request.get("prompt");
                String systemInstruction = request.get("systemInstruction");
                return llmRouterService.generateContent(prompt, systemInstruction)
                                .map(result -> ResponseEntity.ok(Map.of("result", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        // ==================== Writing Assistant Endpoints ====================

        /**
         * Grammar check
         */
        @PostMapping("/writing/grammar-check")
        public Mono<ResponseEntity<Map<String, String>>> grammarCheckWriting(@RequestBody Map<String, String> request) {
                String text = request.get("text");
                return llmRouterService.grammarCheck(text)
                                .map(result -> ResponseEntity.ok(Map.of("result", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Spell check
         */
        @PostMapping("/writing/spell-check")
        public Mono<ResponseEntity<Map<String, String>>> spellCheck(@RequestBody Map<String, String> request) {
                String text = request.get("text");
                String prompt = """
                                Check the following text for spelling errors and suggest corrections.
                                Return as JSON: {"errors": [{"word": "...", "suggestion": "..."}], "corrected_text": "..."}

                                Text:
                                """
                                + text;
                return llmRouterService.generateContent(prompt, null)
                                .map(result -> ResponseEntity.ok(Map.of("result", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Improve sentence/writing
         */
        @PostMapping("/writing/improve")
        public Mono<ResponseEntity<Map<String, String>>> improveSentence(@RequestBody Map<String, String> request) {
                String text = request.get("text");
                String style = request.getOrDefault("style", "academic");
                String prompt = String.format("""
                                Improve the following text to make it more %s. Maintain the original meaning.
                                Return as JSON: {"improved_text": "...", "changes": ["..."]}

                                Text:
                                %s
                                """, style, text);
                return llmRouterService.generateContent(prompt, null)
                                .map(result -> ResponseEntity.ok(Map.of("result", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Get writing score
         */
        @PostMapping("/writing/score")
        public Mono<ResponseEntity<Map<String, String>>> getWritingScore(@RequestBody Map<String, String> request) {
                String text = request.get("text");
                String prompt = """
                                Analyze the following text and provide a writing quality score.
                                Return as JSON: {
                                    "overall_score": 85,
                                    "clarity": 80,
                                    "grammar": 90,
                                    "vocabulary": 85,
                                    "structure": 80,
                                    "feedback": "..."
                                }

                                Text:
                                """ + text;
                return llmRouterService.generateContent(prompt, null)
                                .map(result -> ResponseEntity.ok(Map.of("result", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        /**
         * Get writing suggestions
         */
        @PostMapping("/writing/suggestions")
        public Mono<ResponseEntity<Map<String, String>>> getWritingSuggestions(
                        @RequestBody Map<String, String> request) {
                String text = request.get("text");
                String prompt = """
                                Analyze the following text and provide suggestions for improvement.
                                Return as JSON: {
                                    "suggestions": [
                                        {"type": "clarity", "original": "...", "suggestion": "...", "reason": "..."},
                                        {"type": "conciseness", "original": "...", "suggestion": "...", "reason": "..."}
                                    ]
                                }

                                Text:
                                """ + text;
                return llmRouterService.generateContent(prompt, null)
                                .map(result -> ResponseEntity.ok(Map.of("result", result)))
                                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                                                .body(Map.of("error", e.getMessage()))));
        }

        // Keep /grammar-check at root level for backwards compatibility
        @PostMapping("/grammar-check")
        public Mono<ResponseEntity<Map<String, String>>> grammarCheck(@RequestBody Map<String, String> request) {
                return grammarCheckWriting(request);
        }
}
