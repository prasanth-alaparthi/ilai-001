package com.muse.ai.agent;

import lombok.*;
import java.time.Instant;
import java.util.*;

/**
 * Agent Template - Pre-built agent configurations
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AgentTemplate {
    private String id;
    private String name;
    private String description;
    private String icon;
    private AgentType type;
    private List<String> defaultTools;
    private String systemPrompt;
    private Map<String, Object> defaultConfig;

    public enum AgentType {
        RESEARCH, // Find and gather information
        NOTES, // Organize and enhance notes
        QUIZ, // Generate and grade quizzes
        SCHEDULE, // Plan and remind
        TUTOR, // Interactive teaching
        FLASHCARD, // Spaced repetition
        SUMMARY, // Condense content
        WRITING, // Help with writing
        CUSTOM // User-defined
    }

    // Pre-built templates
    public static final Map<AgentType, AgentTemplate> TEMPLATES = Map.of(
            AgentType.RESEARCH, AgentTemplate.builder()
                    .id("research")
                    .name("Research Agent")
                    .description("Finds and gathers information on any topic")
                    .icon("🔍")
                    .type(AgentType.RESEARCH)
                    .defaultTools(List.of("web.search", "feed.search", "notes.search",
                            "notes.create", "ai.summarize"))
                    .systemPrompt("""
                            You are a research assistant. Your goal is to find accurate,
                            relevant information on the requested topic. Always cite sources
                            and save important findings as notes.
                            """)
                    .defaultConfig(Map.of("maxSources", 10, "summarizeResults", true))
                    .build(),

            AgentType.NOTES, AgentTemplate.builder()
                    .id("notes")
                    .name("Notes Agent")
                    .description("Organizes and enhances your notes")
                    .icon("📝")
                    .type(AgentType.NOTES)
                    .defaultTools(List.of("notes.search", "notes.update", "notes.link",
                            "notes.summarize", "ai.summarize"))
                    .systemPrompt("""
                            You are a notes organization assistant. Your goal is to help
                            organize, link, and enhance notes. Find connections between
                            topics and suggest improvements.
                            """)
                    .defaultConfig(Map.of("autoLink", true, "suggestTags", true))
                    .build(),

            AgentType.QUIZ, AgentTemplate.builder()
                    .id("quiz")
                    .name("Quiz Agent")
                    .description("Generates practice questions and grades answers")
                    .icon("📋")
                    .type(AgentType.QUIZ)
                    .defaultTools(List.of("quiz.generate", "quiz.grade", "quiz.explain",
                            "notes.search", "ai.explain"))
                    .systemPrompt("""
                            You are a quiz master. Generate challenging but fair questions
                            based on the user's notes and learning level. Provide detailed
                            explanations for wrong answers.
                            """)
                    .defaultConfig(Map.of("adaptDifficulty", true, "includeExplanations", true))
                    .build(),

            AgentType.SCHEDULE, AgentTemplate.builder()
                    .id("schedule")
                    .name("Schedule Agent")
                    .description("Plans optimal study sessions and reminders")
                    .icon("📅")
                    .type(AgentType.SCHEDULE)
                    .defaultTools(List.of("calendar.createEvent", "calendar.setReminder",
                            "calendar.blockStudyTime", "calendar.getSchedule", "study.getProgress"))
                    .systemPrompt("""
                            You are a study planner. Analyze the user's schedule and learning
                            goals to create optimal study sessions. Consider their preferred
                            study times and break patterns.
                            """)
                    .defaultConfig(Map.of("breakInterval", 25, "breakDuration", 5))
                    .build(),

            AgentType.TUTOR, AgentTemplate.builder()
                    .id("tutor")
                    .name("Tutor Agent")
                    .description("Provides interactive teaching and explanations")
                    .icon("👨‍🏫")
                    .type(AgentType.TUTOR)
                    .defaultTools(List.of("ai.explain", "ai.generate", "notes.search",
                            "quiz.generate", "ai.summarize"))
                    .systemPrompt("""
                            You are a patient, knowledgeable tutor. Explain concepts at the
                            user's level, use analogies, and check understanding with questions.
                            Adapt your teaching style to the user's learning preferences.
                            """)
                    .defaultConfig(Map.of("adaptToLevel", true, "useAnalogies", true))
                    .build(),

            AgentType.FLASHCARD, AgentTemplate.builder()
                    .id("flashcard")
                    .name("Flashcard Agent")
                    .description("Creates and manages spaced repetition flashcards")
                    .icon("🃏")
                    .type(AgentType.FLASHCARD)
                    .defaultTools(List.of("notes.generateFlashcards", "study.spacedRepetition",
                            "notes.search", "ai.summarize"))
                    .systemPrompt("""
                            You create effective flashcards using proven memory techniques.
                            Apply spaced repetition algorithms and adjust difficulty based
                            on the user's retention rate.
                            """)
                    .defaultConfig(Map.of("algorithm", "SM2", "initialInterval", 1))
                    .build(),

            AgentType.SUMMARY, AgentTemplate.builder()
                    .id("summary")
                    .name("Summary Agent")
                    .description("Condenses and extracts key information")
                    .icon("📄")
                    .type(AgentType.SUMMARY)
                    .defaultTools(List.of("ai.summarize", "notes.summarize", "web.summarize",
                            "feed.summarize", "notes.create"))
                    .systemPrompt("""
                            You are an expert at extracting and condensing information.
                            Create clear, hierarchical summaries that capture the essence
                            of the content while preserving key details.
                            """)
                    .defaultConfig(Map.of("format", "bullet_points", "maxLength", 500))
                    .build(),

            AgentType.WRITING, AgentTemplate.builder()
                    .id("writing")
                    .name("Writing Agent")
                    .description("Helps improve and enhance written content")
                    .icon("✍️")
                    .type(AgentType.WRITING)
                    .defaultTools(List.of("ai.generate", "ai.summarize", "notes.update",
                            "notes.search"))
                    .systemPrompt("""
                            You are a skilled writing assistant. Help improve clarity,
                            grammar, and style while maintaining the author's voice.
                            Offer suggestions without being prescriptive.
                            """)
                    .defaultConfig(Map.of("preserveVoice", true, "suggestOnly", true))
                    .build(),

            AgentType.CUSTOM, AgentTemplate.builder()
                    .id("custom")
                    .name("Custom Agent")
                    .description("User-defined agent with custom tools and prompts")
                    .icon("🤖")
                    .type(AgentType.CUSTOM)
                    .defaultTools(List.of())
                    .systemPrompt("You are a helpful assistant.")
                    .defaultConfig(Map.of())
                    .build());

    public static AgentTemplate getTemplate(AgentType type) {
        return TEMPLATES.get(type);
    }

    public static List<AgentTemplate> getAllTemplates() {
        return new ArrayList<>(TEMPLATES.values());
    }
}
