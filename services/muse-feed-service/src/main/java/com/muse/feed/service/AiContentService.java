package com.muse.feed.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiContentService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient.Builder webClientBuilder;

    // Simple implementation using Gemini API (if available) or fallback
    public String generateSummary(String title, String description) {
        // TODO: Integrate actual Gemini call here using the API key
        // For now, return a formatted string to ensure it works immediately
        return String.format("%s\n\n%s", title, description);
    }

    public String generateImagePrompt(String title) {
        return "A realistic, high-quality news image representing: " + title;
    }
}
