package com.muse.notes.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AskQuestionResponse {
    private String answer;
    private List<SourceNote> sources;

    @Data
    @Builder
    public static class SourceNote {
        private Long id;
        private String title;
        private String excerpt;
    }
}
