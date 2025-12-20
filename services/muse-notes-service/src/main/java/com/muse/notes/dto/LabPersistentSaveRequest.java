package com.muse.notes.dto;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for Lab Persistent Save feature.
 * Captures equation, solution, variables, and research results from the Lab.
 */
public class LabPersistentSaveRequest {

    private AutoPath autoPath;
    private String equation;
    private String solution;
    private Map<String, Object> variables;
    private String researchResults;
    private List<Source> sources;
    private String subject;

    // Getters and Setters
    public AutoPath getAutoPath() {
        return autoPath;
    }

    public void setAutoPath(AutoPath autoPath) {
        this.autoPath = autoPath;
    }

    public String getEquation() {
        return equation;
    }

    public void setEquation(String equation) {
        this.equation = equation;
    }

    public String getSolution() {
        return solution;
    }

    public void setSolution(String solution) {
        this.solution = solution;
    }

    public Map<String, Object> getVariables() {
        return variables;
    }

    public void setVariables(Map<String, Object> variables) {
        this.variables = variables;
    }

    public String getResearchResults() {
        return researchResults;
    }

    public void setResearchResults(String researchResults) {
        this.researchResults = researchResults;
    }

    public List<Source> getSources() {
        return sources;
    }

    public void setSources(List<Source> sources) {
        this.sources = sources;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    /**
     * Auto-path configuration for directory structure.
     */
    public static class AutoPath {
        private String notebook; // e.g., "Maths Lab"
        private String section; // e.g., "21-12-2024"
        private String title; // e.g., "Research Session"

        public String getNotebook() {
            return notebook;
        }

        public void setNotebook(String notebook) {
            this.notebook = notebook;
        }

        public String getSection() {
            return section;
        }

        public void setSection(String section) {
            this.section = section;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }
    }

    /**
     * Source reference from research results.
     */
    public static class Source {
        private String title;
        private String url;
        private String content;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
