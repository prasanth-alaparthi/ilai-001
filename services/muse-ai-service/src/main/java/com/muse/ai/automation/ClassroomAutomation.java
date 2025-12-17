package com.muse.ai.automation;

import com.muse.ai.service.LLMRouterService;
import com.muse.ai.service.PersonalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;

/**
 * Classroom Module Automation
 * Automates grading, progress tracking, and study recommendations
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClassroomAutomation {

    private final AutomationEngine automationEngine;
    private final LLMRouterService llmRouterService;
    private final PersonalizationService personalizationService;

    @PostConstruct
    public void registerAutomations() {
        log.info("Registering Classroom module automations...");

        // Update skill level after quiz
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("classroom.update-skill-level")
                .description("Update skill level based on quiz performance")
                .triggerEvent("quiz.completed")
                .action(this::updateSkillLevel)
                .build());

        // Auto-grade text assignments
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("classroom.auto-grade")
                .description("Auto-grade short answer assignments")
                .triggerEvent("assignment.submitted")
                .action(this::autoGrade)
                .build());

        // Deadline reminder
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("classroom.deadline-reminder")
                .description("Send reminder when deadline approaches")
                .triggerEvent("deadline.approaching")
                .action(this::sendDeadlineReminder)
                .build());

        // Suggest next lesson
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("classroom.suggest-next")
                .description("Suggest next lesson based on progress")
                .triggerEvent("lesson.completed")
                .action(this::suggestNextLesson)
                .build());

        // Generate practice problems
        automationEngine.registerRule(AutomationEngine.AutomationRule.builder()
                .name("classroom.generate-practice")
                .description("Generate practice problems for weak areas")
                .triggerEvent("quiz.scored-low")
                .conditions(Map.of("scoreBelow", 70))
                .action(this::generatePracticeProblems)
                .build());

        log.info("Registered {} Classroom automation rules", 5);
    }

    private void updateSkillLevel(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        String topic = getString(event, "topic");
        Double score = getDouble(event, "score");

        if (userId == null || topic == null)
            return;

        Map<String, Object> activity = Map.of(
                "type", "quiz_completed",
                "topic", topic,
                "score", score != null ? score : 0.0);

        personalizationService.recordActivity(userId, activity);
        log.info("Updated skill level for user {} in topic {}: score={}", userId, topic, score);
    }

    private void autoGrade(Map<String, Object> event) {
        Long submissionId = getLong(event, "submissionId");
        String answer = getString(event, "answer");
        String rubric = getString(event, "rubric");

        if (answer == null)
            return;

        String prompt = """
                Grade this student answer based on the rubric.

                RUBRIC: %s

                STUDENT ANSWER: %s

                Return JSON: {"score": 0-100, "feedback": "specific feedback", "suggestions": ["improvement1"]}
                """.formatted(rubric != null ? rubric : "Accuracy and completeness", answer);

        llmRouterService.generateContent(prompt, "json")
                .subscribe(response -> {
                    log.info("Auto-graded submission {}: {}", submissionId, response);
                    // TODO: Store grade and feedback
                });
    }

    private void sendDeadlineReminder(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        String assignmentName = getString(event, "assignmentName");
        String deadline = getString(event, "deadline");

        log.info("Sending deadline reminder to user {} for {}", userId, assignmentName);
        // TODO: Send notification
    }

    private void suggestNextLesson(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        String completedLesson = getString(event, "lessonId");

        Map<String, Object> recommendations = personalizationService.getRecommendations(userId);
        log.info("Suggesting next lesson for user {} (completed {})", userId, completedLesson);
    }

    private void generatePracticeProblems(Map<String, Object> event) {
        Long userId = getLong(event, "userId");
        String topic = getString(event, "topic");

        String prompt = """
                Generate 3 practice problems for a student who scored low on: %s

                Return JSON array of problems:
                [{"question": "...", "difficulty": "easy|medium", "hint": "..."}]
                """.formatted(topic);

        llmRouterService.generateContent(prompt, "json")
                .subscribe(response -> {
                    log.info("Generated practice problems for user {} on {}", userId, topic);
                    // TODO: Store practice problems
                });
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Long)
            return (Long) value;
        if (value instanceof Integer)
            return ((Integer) value).longValue();
        return null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Double)
            return (Double) value;
        if (value instanceof Integer)
            return ((Integer) value).doubleValue();
        return null;
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }
}
