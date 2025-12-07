package com.muse.auth.feed.service;

import com.muse.auth.feed.dto.ModerationResult;
import org.springframework.stereotype.Service;

@Service
public class ContentModerationService {
    public ModerationResult moderatePost(String content) {
        // Placeholder implementation
        return ModerationResult.builder()
                .studyRelated(true)
                .ageAppropriate(true)
                .reason("OK")
                .subjectTag("general")
                .requiresReview(false)
                .build();
    }
}
