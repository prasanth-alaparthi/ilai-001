package com.muse.ai.agent;

import lombok.*;

import java.util.*;
import java.util.function.Function;

/**
 * Tool Registry - All available actions that agents can use
 * Every module action becomes an agent tool
 */
public class ToolRegistry {

    private static final Map<String, Tool> tools = new HashMap<>();

    static {
        // ============== Notes Tools ==============
        registerTool("notes.create", "Create a new note",
                List.of("title", "content", "sectionId"), "note");
        registerTool("notes.update", "Update an existing note",
                List.of("noteId", "title", "content"), "note");
        registerTool("notes.search", "Search notes by keyword",
                List.of("query", "limit"), "notes[]");
        registerTool("notes.semanticSearch", "Semantic search in notes",
                List.of("query", "limit"), "notes[]");
        registerTool("notes.summarize", "Summarize a note",
                List.of("noteId"), "summary");
        registerTool("notes.link", "Link two notes together",
                List.of("sourceId", "targetId"), "link");
        registerTool("notes.generateFlashcards", "Create flashcards from note",
                List.of("noteId"), "flashcards[]");

        // ============== Feed Tools ==============
        registerTool("feed.search", "Search articles in feed",
                List.of("query", "limit"), "articles[]");
        registerTool("feed.save", "Save an article to reading list",
                List.of("articleId"), "saved");
        registerTool("feed.summarize", "Summarize an article",
                List.of("articleId"), "summary");
        registerTool("feed.recommend", "Get personalized recommendations",
                List.of("userId", "count"), "articles[]");

        // ============== Calendar Tools ==============
        registerTool("calendar.createEvent", "Create a calendar event",
                List.of("title", "startTime", "endTime", "description"), "event");
        registerTool("calendar.setReminder", "Set a reminder",
                List.of("message", "time"), "reminder");
        registerTool("calendar.blockStudyTime", "Block study time",
                List.of("topic", "duration", "preferredTime"), "event");
        registerTool("calendar.getSchedule", "Get user's schedule",
                List.of("startDate", "endDate"), "events[]");

        // ============== Quiz Tools ==============
        registerTool("quiz.generate", "Generate quiz questions",
                List.of("content", "count", "difficulty"), "questions[]");
        registerTool("quiz.grade", "Grade a quiz answer",
                List.of("questionId", "answer"), "result");
        registerTool("quiz.explain", "Explain correct answer",
                List.of("questionId"), "explanation");

        // ============== Journal Tools ==============
        registerTool("journal.create", "Create journal entry",
                List.of("date", "highlights", "challenges", "intentions"), "entry");
        registerTool("journal.analyze", "Analyze journal patterns",
                List.of("period"), "insights");
        registerTool("journal.getMoodTrend", "Get mood trend",
                List.of("startDate", "endDate"), "moods[]");

        // ============== Web Search Tools ==============
        registerTool("web.search", "Search the web",
                List.of("query", "limit"), "results[]");
        registerTool("web.summarize", "Summarize a web page",
                List.of("url"), "summary");
        registerTool("web.extract", "Extract key info from page",
                List.of("url", "fields"), "data");

        // ============== Study Tools ==============
        registerTool("study.spacedRepetition", "Schedule spaced repetition",
                List.of("topic", "items"), "schedule");
        registerTool("study.getProgress", "Get study progress for topic",
                List.of("topic"), "progress");
        registerTool("study.recommend", "Get study recommendations",
                List.of("userId"), "recommendations");

        // ============== Communication Tools ==============
        registerTool("chat.send", "Send a message",
                List.of("conversationId", "message"), "sent");
        registerTool("chat.shareNote", "Share a note in chat",
                List.of("noteId", "conversationId"), "shared");

        // ============== AI Tools ==============
        registerTool("ai.summarize", "Summarize content",
                List.of("content"), "summary");
        registerTool("ai.explain", "Explain content at level",
                List.of("content", "level"), "explanation");
        registerTool("ai.generate", "Generate content from prompt",
                List.of("prompt", "systemInstruction"), "result");
        registerTool("ai.translate", "Translate content",
                List.of("content", "targetLanguage"), "translated");
    }

    private static void registerTool(String name, String description,
            List<String> parameters, String returnType) {
        tools.put(name, Tool.builder()
                .name(name)
                .description(description)
                .parameters(parameters)
                .returnType(returnType)
                .build());
    }

    public static Tool getTool(String name) {
        return tools.get(name);
    }

    public static List<Tool> getAllTools() {
        return new ArrayList<>(tools.values());
    }

    public static List<Tool> getToolsByCategory(String category) {
        return tools.values().stream()
                .filter(t -> t.getName().startsWith(category + "."))
                .toList();
    }

    public static Map<String, List<Tool>> getToolsByCategories() {
        Map<String, List<Tool>> categorized = new HashMap<>();
        for (Tool tool : tools.values()) {
            String category = tool.getName().split("\\.")[0];
            categorized.computeIfAbsent(category, k -> new ArrayList<>()).add(tool);
        }
        return categorized;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Tool {
        private String name;
        private String description;
        private List<String> parameters;
        private String returnType;
        private Function<Map<String, Object>, Object> executor;
    }
}
