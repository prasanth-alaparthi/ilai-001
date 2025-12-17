package com.muse.ai.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;

/**
 * Audio Overview Service - Phase 5
 * Generates podcast-style audio summaries (like NotebookLM's Audio Overview)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AudioOverviewService {

    private final LLMRouterService llmRouterService;
    private final WebClient.Builder webClientBuilder;

    @Value("${google.tts.api.key:}")
    private String ttsApiKey;

    /**
     * Generate podcast-style script from notes
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "podcastScriptFallback")
    public Mono<PodcastScript> generatePodcastScript(String content, String topic) {
        String prompt = """
                Create a podcast-style dialogue about: %s

                Based on this content:
                %s

                Format as a conversation between two hosts (Alex and Sam):

                ALEX: [engaging introduction]
                SAM: [responds and adds context]
                ALEX: [explains a key concept]
                SAM: [asks clarifying question]

                Guidelines:
                - Keep it conversational and engaging
                - Explain complex concepts simply
                - Include interesting examples
                - About 5-7 minutes when read aloud (roughly 800-1000 words)
                - End with key takeaways summary
                """.formatted(topic, content);

        return llmRouterService.generateContent(prompt, "podcast_script")
                .map(response -> parsePodcastScript(response, topic));
    }

    /**
     * Generate a summary audio script (single narrator)
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "summaryScriptFallback")
    public Mono<AudioScript> generateSummaryScript(String content) {
        String prompt = """
                Create an audio summary script for narration:

                %s

                Guidelines:
                - Write for spoken delivery (conversational tone)
                - Include natural pauses marked as [pause]
                - Emphasize key terms with *asterisks*
                - About 2-3 minutes when read aloud
                - Start with an engaging hook
                - End with a memorable conclusion
                """.formatted(content);

        return llmRouterService.generateContent(prompt, "audio_script")
                .map(this::parseAudioScript);
    }

    /**
     * Generate audio using Google TTS (if API key configured)
     * Note: Actual TTS implementation would require Google Cloud credentials
     */
    public Mono<AudioResult> generateAudio(String script, String voice) {
        if (ttsApiKey == null || ttsApiKey.isBlank()) {
            log.info("TTS API not configured, returning script only");
            return Mono.just(new AudioResult(
                    null,
                    script,
                    "TTS not configured - audio generation unavailable",
                    0));
        }

        // For actual implementation, would call Google Cloud TTS API
        // This is a placeholder showing the intended structure
        return Mono.just(new AudioResult(
                null, // Would be Base64 encoded audio
                script,
                "Audio generation placeholder - configure Google Cloud TTS",
                estimateDuration(script)));
    }

    /**
     * Get available voice options
     */
    public List<VoiceOption> getAvailableVoices() {
        return List.of(
                new VoiceOption("en-US-Journey-D", "Alex (Male)", "en-US"),
                new VoiceOption("en-US-Journey-F", "Sam (Female)", "en-US"),
                new VoiceOption("en-US-Neural2-C", "Chris (Male)", "en-US"),
                new VoiceOption("en-US-Neural2-E", "Emma (Female)", "en-US"),
                new VoiceOption("en-GB-Neural2-B", "James (British Male)", "en-GB"),
                new VoiceOption("en-GB-Neural2-A", "Sophie (British Female)", "en-GB"));
    }

    // ============== Parsing Methods ==============

    private PodcastScript parsePodcastScript(String response, String topic) {
        List<DialogueLine> lines = new ArrayList<>();
        int estimatedSeconds = 0;

        for (String line : response.split("\n")) {
            line = line.trim();
            if (line.startsWith("ALEX:") || line.startsWith("SAM:")) {
                String speaker = line.startsWith("ALEX:") ? "Alex" : "Sam";
                String text = line.substring(line.indexOf(":") + 1).trim();
                lines.add(new DialogueLine(speaker, text));
                estimatedSeconds += estimateLineSeconds(text);
            }
        }

        return new PodcastScript(
                topic,
                "A deep dive into " + topic,
                lines,
                estimatedSeconds,
                response);
    }

    private AudioScript parseAudioScript(String response) {
        List<AudioSegment> segments = new ArrayList<>();
        String[] paragraphs = response.split("\n\n");
        int position = 0;

        for (String para : paragraphs) {
            if (!para.isBlank()) {
                int duration = estimateLineSeconds(para);
                segments.add(new AudioSegment(
                        position,
                        para.trim(),
                        duration,
                        para.contains("[pause]") ? "pause" : "normal"));
                position += duration;
            }
        }

        return new AudioScript(segments, position, response);
    }

    private int estimateLineSeconds(String text) {
        // Average speaking rate: 150 words per minute = 2.5 words per second
        int wordCount = text.split("\\s+").length;
        return Math.max(2, wordCount / 2); // Minimum 2 seconds
    }

    private int estimateDuration(String script) {
        int wordCount = script.split("\\s+").length;
        return (wordCount / 150) * 60; // Convert to seconds
    }

    // ============== Fallback Methods ==============

    private Mono<PodcastScript> podcastScriptFallback(String content, String topic, Throwable t) {
        log.warn("Podcast script fallback: {}", t.getMessage());
        return Mono.just(new PodcastScript(
                topic,
                "Audio overview",
                List.of(new DialogueLine("Narrator", "Audio generation is temporarily unavailable.")),
                10,
                ""));
    }

    private Mono<AudioScript> summaryScriptFallback(String content, Throwable t) {
        log.warn("Summary script fallback: {}", t.getMessage());
        return Mono.just(new AudioScript(
                Collections.emptyList(),
                0,
                "Summary generation is temporarily unavailable."));
    }

    // ============== Records ==============

    public record PodcastScript(
            String topic,
            String description,
            List<DialogueLine> dialogue,
            int estimatedSeconds,
            String fullScript) {
    }

    public record DialogueLine(String speaker, String text) {
    }

    public record AudioScript(List<AudioSegment> segments, int totalSeconds, String fullScript) {
    }

    public record AudioSegment(int startSecond, String text, int durationSeconds, String type) {
    }

    public record AudioResult(String audioBase64, String script, String message, int durationSeconds) {
    }

    public record VoiceOption(String voiceId, String displayName, String language) {
    }
}
