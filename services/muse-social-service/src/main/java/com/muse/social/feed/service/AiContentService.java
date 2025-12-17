package com.muse.social.feed.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiContentService {

    private final String geminiApiKey;

    public AiContentService(@Value("${gemini.api.key:${GEMINI_API_KEY:}}") String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
    }

    public String generateSummary(String title, String description) {
        // Simple fallback - full AI integration can be added later
        return String.format("%s\n\n%s", title, description);
    }

    public String generateImagePrompt(String title) {
        return "A realistic, high-quality news image representing: " + title;
    }
}
