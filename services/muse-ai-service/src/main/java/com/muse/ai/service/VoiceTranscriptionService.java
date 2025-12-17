package com.muse.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.*;

/**
 * Voice Transcription Service - Convert voice notes to text
 * 
 * Features:
 * - Audio file transcription using Gemini/Whisper
 * - Support for multiple languages (Hindi, Telugu, Tamil, English)
 * - Speaker diarization for lectures
 * - Key points extraction from transcribed text
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VoiceTranscriptionService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash-001}")
    private String geminiModel;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    // Supported audio formats
    private static final Set<String> SUPPORTED_FORMATS = Set.of(
            "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/webm", "audio/m4a");

    /**
     * Transcribe audio file to text
     */
    public Map<String, Object> transcribeAudio(MultipartFile audioFile, String language, Long userId) {
        log.info("Transcribing audio for user {}, language: {}, size: {} bytes",
                userId, language, audioFile != null ? audioFile.getSize() : 0);

        if (audioFile == null || audioFile.isEmpty()) {
            return Map.of("success", false, "error", "No audio file provided");
        }

        String contentType = audioFile.getContentType();
        if (contentType == null || !SUPPORTED_FORMATS.contains(contentType.toLowerCase())) {
            return Map.of("success", false, "error", "Unsupported audio format. Supported: WAV, MP3, OGG, WebM, M4A");
        }

        try {
            byte[] audioBytes = audioFile.getBytes();
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

            String transcription = callGeminiAudioTranscription(base64Audio, contentType, language);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("transcription", transcription);
            result.put("language", language != null ? language : "auto");
            result.put("duration", estimateDuration(audioFile.getSize()));
            result.put("wordCount", countWords(transcription));

            return result;
        } catch (IOException e) {
            log.error("Failed to read audio file: {}", e.getMessage());
            return Map.of("success", false, "error", "Failed to process audio file");
        } catch (Exception e) {
            log.error("Transcription failed: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Transcription failed. Please try again.");
        }
    }

    private String callGeminiAudioTranscription(String base64Audio, String mimeType, String language) {
        String url = String.format(GEMINI_URL, geminiModel, geminiApiKey);

        String languageHint = language != null ? "The audio is in " + language + " language. "
                : "Detect the language automatically. ";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", languageHint + """
                                        Transcribe this audio accurately.
                                        Include punctuation and paragraph breaks where appropriate.
                                        If there are multiple speakers, indicate speaker changes.
                                        Return ONLY the transcription, no commentary.
                                        """),
                                Map.of(
                                        "inline_data", Map.of(
                                                "mime_type", mimeType,
                                                "data", base64Audio))))),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "maxOutputTokens", 8192));

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
            log.error("Failed to parse transcription response", e);
            throw new RuntimeException("Failed to parse transcription");
        }
    }

    /**
     * Extract key points from transcribed text
     */
    public Map<String, Object> extractKeyPoints(String transcription, Long userId) {
        log.info("Extracting key points for user {}", userId);

        if (transcription == null || transcription.trim().isEmpty()) {
            return Map.of("success", false, "error", "No transcription provided");
        }

        try {
            String url = String.format(GEMINI_URL, geminiModel, geminiApiKey);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(
                                    Map.of("text", """
                                            Analyze this transcription and extract:

                                            1. SUMMARY: 2-3 sentence overview
                                            2. KEY POINTS: Bullet points of main ideas (max 10)
                                            3. TOPICS: Main topics discussed
                                            4. ACTION ITEMS: Any tasks or to-dos mentioned
                                            5. QUESTIONS: Any questions raised

                                            TRANSCRIPTION:
                                            """ + transcription)))),
                    "generationConfig", Map.of(
                            "temperature", 0.3,
                            "maxOutputTokens", 2048));

            String response = webClient.post()
                    .uri(url)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            String analysis = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return Map.of(
                    "success", true,
                    "analysis", analysis,
                    "transcription", transcription);
        } catch (Exception e) {
            log.error("Failed to extract key points: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Failed to analyze transcription");
        }
    }

    /**
     * Convert transcription to formatted notes
     */
    public Map<String, Object> transcriptionToNotes(String transcription, String title, Long userId) {
        log.info("Converting transcription to notes for user {}", userId);

        if (transcription == null || transcription.trim().isEmpty()) {
            return Map.of("success", false, "error", "No transcription provided");
        }

        try {
            String url = String.format(GEMINI_URL, geminiModel, geminiApiKey);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(
                                    Map.of("text", """
                                            Convert this voice note transcription into well-structured study notes.

                                            Use the following format:
                                            - Use headers (##) for main topics
                                            - Use bullet points for key facts
                                            - Highlight important terms in **bold**
                                            - Add any relevant equations or formulas
                                            - Include a summary at the end

                                            Title: %s

                                            TRANSCRIPTION:
                                            %s
                                            """.formatted(title != null ? title : "Voice Notes", transcription))))),
                    "generationConfig", Map.of(
                            "temperature", 0.4,
                            "maxOutputTokens", 4096));

            String response = webClient.post()
                    .uri(url)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            String formattedNotes = root.path("candidates").get(0).path("content").path("parts").get(0).path("text")
                    .asText();

            return Map.of(
                    "success", true,
                    "title", title != null ? title : "Voice Notes",
                    "content", formattedNotes,
                    "originalTranscription", transcription);
        } catch (Exception e) {
            log.error("Failed to convert to notes: {}", e.getMessage(), e);
            return Map.of("success", false, "error", "Failed to format notes");
        }
    }

    // Helper methods
    private int estimateDuration(long fileSize) {
        // Rough estimate: ~1MB per minute for typical audio
        return Math.max(1, (int) (fileSize / (1024 * 1024)));
    }

    private int countWords(String text) {
        if (text == null || text.isEmpty())
            return 0;
        return text.split("\\s+").length;
    }

    /**
     * Supported languages for transcription
     */
    public List<Map<String, String>> getSupportedLanguages() {
        return List.of(
                Map.of("code", "en", "name", "English"),
                Map.of("code", "hi", "name", "Hindi"),
                Map.of("code", "te", "name", "Telugu"),
                Map.of("code", "ta", "name", "Tamil"),
                Map.of("code", "kn", "name", "Kannada"),
                Map.of("code", "ml", "name", "Malayalam"),
                Map.of("code", "mr", "name", "Marathi"),
                Map.of("code", "bn", "name", "Bengali"),
                Map.of("code", "gu", "name", "Gujarati"),
                Map.of("code", "auto", "name", "Auto-detect"));
    }
}
