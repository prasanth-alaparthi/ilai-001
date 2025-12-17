package com.muse.ai.controller;

import com.muse.ai.service.VoiceTranscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Voice Controller - Audio transcription and voice notes
 */
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
@Slf4j
public class VoiceController {

    private final VoiceTranscriptionService voiceTranscriptionService;

    /**
     * Transcribe audio file to text
     */
    @PostMapping("/transcribe")
    public ResponseEntity<Map<String, Object>> transcribeAudio(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam(value = "language", required = false) String language,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        Map<String, Object> result = voiceTranscriptionService.transcribeAudio(audioFile, language, userId);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Extract key points from transcription
     */
    @PostMapping("/extract-key-points")
    public ResponseEntity<Map<String, Object>> extractKeyPoints(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        String transcription = request.get("transcription");
        Map<String, Object> result = voiceTranscriptionService.extractKeyPoints(transcription, userId);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Convert transcription to formatted notes
     */
    @PostMapping("/to-notes")
    public ResponseEntity<Map<String, Object>> transcriptionToNotes(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        String transcription = request.get("transcription");
        String title = request.get("title");

        Map<String, Object> result = voiceTranscriptionService.transcriptionToNotes(transcription, title, userId);

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Get supported languages
     */
    @GetMapping("/languages")
    public ResponseEntity<List<Map<String, String>>> getSupportedLanguages() {
        return ResponseEntity.ok(voiceTranscriptionService.getSupportedLanguages());
    }
}
