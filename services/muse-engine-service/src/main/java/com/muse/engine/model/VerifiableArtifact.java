package com.muse.engine.model;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class VerifiableArtifact {
    private String problemId;
    private String subject;
    private String cluster;

    // Assumptions & Constants
    private List<Assumption> assumptions;

    // The Derivation (LaTeX)
    private String derivationLatex;

    // The Evidence
    private Evidence evidence;

    @Data
    @Builder
    public static class Assumption {
        private String name;
        private String value;
        private String unit;
        private String description;
    }

    @Data
    @Builder
    public static class Evidence {
        private String type; // "CODE_LOGS" or "RAG_CITATIONS"
        private String content;
        private List<String> citations;
    }
}
