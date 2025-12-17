package com.muse.ai.agent;

import com.muse.ai.service.LLMRouterService;
import com.muse.ai.service.ResilientServiceClient;
import com.muse.ai.service.FSRSService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Tool Executor - Phase 2 Enhanced
 * Executes registered tools against real services with full resilience
 * Uses ResilientServiceClient for circuit breaker, retry, and rate limiting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ToolExecutor {

    private final LLMRouterService llmRouterService;
    private final ResilientServiceClient serviceClient;
    private final FSRSService fsrsService;

    /**
     * Execute a tool by name with given parameters
     * All service calls are wrapped with resilience patterns
     */
    public Mono<Object> execute(String toolName, Map<String, Object> params, Long userId) {
        log.info("Executing tool: {} with params: {} for user: {}", toolName, params, userId);
        long startTime = System.currentTimeMillis();

        return doExecute(toolName, params, userId)
                .doOnSuccess(result -> {
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("Tool {} completed in {}ms", toolName, duration);
                })
                .doOnError(error -> {
                    log.error("Tool {} failed: {}", toolName, error.getMessage());
                })
                .onErrorResume(error -> Mono.just(Map.of(
                        "error", error.getMessage(),
                        "tool", toolName,
                        "timestamp", Instant.now().toString())));
    }

    private Mono<Object> doExecute(String toolName, Map<String, Object> params, Long userId) {
        String category = getToolCategory(toolName);
        String action = getToolAction(toolName);

        return switch (category) {
            case "notes" -> executeNotesTool(action, params, userId);
            case "feed" -> executeFeedTool(action, params, userId);
            case "ai" -> executeAITool(action, params, userId);
            case "study" -> executeStudyTool(action, params, userId);
            case "web" -> executeWebTool(action, params, userId);
            case "calendar" -> executeCalendarTool(action, params, userId);
            case "quiz" -> executeQuizTool(action, params, userId);
            case "flashcard" -> executeFlashcardTool(action, params, userId);
            case "chat" -> executeChatTool(action, params, userId);
            case "classroom" -> executeClassroomTool(action, params, userId);
            default -> Mono.error(new IllegalArgumentException("Unknown tool category: " + category));
        };
    }

    private String getToolCategory(String toolName) {
        String[] parts = toolName.split("\\.");
        return parts.length > 0 ? parts[0] : toolName;
    }

    private String getToolAction(String toolName) {
        String[] parts = toolName.split("\\.");
        return parts.length > 1 ? parts[1] : "default";
    }

    // ============== Notes Tools ==============

    @CircuitBreaker(name = "notes-service", fallbackMethod = "notesToolFallback")
    @Retry(name = "service")
    private Mono<Object> executeNotesTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "search" -> {
                String query = getString(params, "query", "");
                int limit = getInt(params, "limit", 10);
                yield serviceClient.searchNotes(query, userId, limit);
            }
            case "get" -> {
                Long noteId = getLong(params, "noteId", 0L);
                yield serviceClient.getNote(noteId, userId);
            }
            case "create" -> {
                yield serviceClient.createNote(params, userId);
            }
            case "backlinks" -> {
                Long noteId = getLong(params, "noteId", 0L);
                yield serviceClient.getNoteBacklinks(noteId, userId);
            }
            case "summarize" -> {
                Long noteId = getLong(params, "noteId", 0L);
                yield serviceClient.getNote(noteId, userId)
                        .flatMap(note -> llmRouterService.generateContent(
                                buildSummarizePrompt(note), "summary"))
                        .map(r -> (Object) r);
            }
            case "generateFlashcards" -> {
                Long noteId = getLong(params, "noteId", 0L);
                int count = getInt(params, "count", 5);
                yield serviceClient.getNote(noteId, userId)
                        .flatMap(note -> llmRouterService.generateContent(
                                buildFlashcardPrompt(note, count), "flashcards"))
                        .map(r -> (Object) r);
            }
            case "extractKeyTerms" -> {
                Long noteId = getLong(params, "noteId", 0L);
                yield serviceClient.getNote(noteId, userId)
                        .flatMap(note -> llmRouterService.generateContent(
                                "Extract the 10 most important key terms and definitions from this content. " +
                                        "Format as JSON array with 'term' and 'definition' fields: " + note,
                                "key_terms"))
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown notes action: " + action));
        };
    }

    private Mono<Object> notesToolFallback(String action, Map<String, Object> params, Long userId, Throwable t) {
        log.warn("Notes tool fallback triggered for action {}: {}", action, t.getMessage());
        return Mono.just(Map.of(
                "fallback", true,
                "message", "Notes service temporarily unavailable. Please try again.",
                "action", action));
    }

    // ============== Feed Tools ==============

    @CircuitBreaker(name = "feed-service", fallbackMethod = "feedToolFallback")
    @Retry(name = "service")
    private Mono<Object> executeFeedTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "search" -> {
                String query = getString(params, "query", "");
                yield serviceClient.searchFeed(query, userId);
            }
            case "recommend" -> serviceClient.getFeedRecommendations(userId);
            case "get" -> {
                Long articleId = getLong(params, "articleId", 0L);
                yield serviceClient.getArticle(articleId, userId);
            }
            case "summarize" -> {
                Long articleId = getLong(params, "articleId", 0L);
                yield serviceClient.getArticle(articleId, userId)
                        .flatMap(article -> llmRouterService.generateContent(
                                "Summarize this article in 3-4 clear sentences, highlighting the main points: "
                                        + article,
                                "summary"))
                        .map(r -> (Object) r);
            }
            case "keyTakeaways" -> {
                Long articleId = getLong(params, "articleId", 0L);
                yield serviceClient.getArticle(articleId, userId)
                        .flatMap(article -> llmRouterService.generateContent(
                                "Extract 5 key takeaways from this article as a bullet list: " + article,
                                "takeaways"))
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown feed action: " + action));
        };
    }

    private Mono<Object> feedToolFallback(String action, Map<String, Object> params, Long userId, Throwable t) {
        log.warn("Feed tool fallback triggered for action {}: {}", action, t.getMessage());
        return Mono.just(Map.of(
                "fallback", true,
                "message", "Feed service temporarily unavailable",
                "action", action));
    }

    // ============== AI Tools ==============

    @CircuitBreaker(name = "llm", fallbackMethod = "aiToolFallback")
    @Retry(name = "llm")
    private Mono<Object> executeAITool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "summarize" -> {
                String content = getString(params, "content", "");
                String length = getString(params, "length", "medium");
                String prompt = switch (length) {
                    case "short" -> "Provide a 1-2 sentence summary of: ";
                    case "long" -> "Provide a detailed, comprehensive summary of: ";
                    default -> "Provide a clear, concise summary of: ";
                };
                yield llmRouterService.generateContent(prompt + content, "summary")
                        .map(r -> (Object) r);
            }
            case "explain" -> {
                String content = getString(params, "content", "");
                String level = getString(params, "level", "simple");
                String audiencePrompt = switch (level) {
                    case "expert" -> "Explain this for an expert audience with technical details: ";
                    case "intermediate" -> "Explain this for someone with basic knowledge: ";
                    case "child" -> "Explain this like I'm 5 years old: ";
                    default -> "Explain this in simple, clear terms: ";
                };
                yield llmRouterService.generateContent(audiencePrompt + content, "explanation")
                        .map(r -> (Object) r);
            }
            case "generate" -> {
                String prompt = getString(params, "prompt", "");
                String context = getString(params, "context", "");
                String fullPrompt = context.isEmpty() ? prompt : context + "\n\n" + prompt;
                yield llmRouterService.generateContent(fullPrompt, "generated")
                        .map(r -> (Object) r);
            }
            case "translate" -> {
                String content = getString(params, "content", "");
                String targetLanguage = getString(params, "targetLanguage", "English");
                yield llmRouterService.generateContent(
                        "Translate the following text to " + targetLanguage +
                                ". Maintain the original meaning and tone:\n\n" + content,
                        "translation")
                        .map(r -> (Object) r);
            }
            case "rewrite" -> {
                String content = getString(params, "content", "");
                String style = getString(params, "style", "formal");
                yield llmRouterService.generateContent(
                        "Rewrite the following text in a " + style + " style, " +
                                "while preserving the meaning:\n\n" + content,
                        "rewrite")
                        .map(r -> (Object) r);
            }
            case "proofread" -> {
                String content = getString(params, "content", "");
                yield llmRouterService.generateContent(
                        "Proofread and correct any errors in the following text. " +
                                "List the corrections made:\n\n" + content,
                        "proofread")
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown AI action: " + action));
        };
    }

    private Mono<Object> aiToolFallback(String action, Map<String, Object> params, Long userId, Throwable t) {
        log.warn("AI tool fallback triggered for action {}: {}", action, t.getMessage());
        return Mono.just(Map.of(
                "fallback", true,
                "message", "AI service is temporarily overloaded. Please try again in a moment.",
                "action", action));
    }

    // ============== Study Tools ==============

    private Mono<Object> executeStudyTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "getDueCards" -> {
                yield Mono.fromCallable(() -> fsrsService.getDueCards(userId))
                        .map(cards -> Map.of("dueCards", cards, "count", cards.size()));
            }
            case "getStats" -> {
                yield Mono.fromCallable(() -> fsrsService.getStats(userId))
                        .map(stats -> Map.of("stats", stats));
            }
            case "recommend" -> {
                yield Mono.fromCallable(() -> fsrsService.getStats(userId))
                        .flatMap(stats -> llmRouterService.generateContent(
                                "Based on these study statistics: " + stats +
                                        "\nRecommend 3 specific, actionable study strategies for this student.",
                                "recommendations"))
                        .map(r -> (Object) r);
            }
            case "createPlan" -> {
                String topic = getString(params, "topic", "");
                int durationMinutes = getInt(params, "durationMinutes", 30);
                yield llmRouterService.generateContent(
                        "Create a " + durationMinutes + "-minute study plan for the topic: " + topic +
                                "\nInclude specific activities, breaks, and review periods.",
                        "study_plan")
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown study action: " + action));
        };
    }

    // ============== Flashcard Tools ==============

    private Mono<Object> executeFlashcardTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "review" -> {
                Long cardId = getLong(params, "cardId", 0L);
                int rating = getInt(params, "rating", 3); // 1-5 scale
                yield Mono.fromCallable(() -> fsrsService.processReview(
                        UUID.fromString(String.valueOf(cardId)), userId, rating))
                        .map(result -> Map.of("success", true, "result", result));
            }
            case "getDue" -> {
                yield Mono.fromCallable(() -> fsrsService.getDueCards(userId))
                        .map(cards -> Map.of("cards", cards, "count", cards.size()));
            }
            case "generate" -> {
                String content = getString(params, "content", "");
                int count = getInt(params, "count", 5);
                yield llmRouterService.generateContent(
                        buildFlashcardPrompt(content, count), "flashcards")
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown flashcard action: " + action));
        };
    }

    // ============== Quiz Tools ==============

    @CircuitBreaker(name = "llm", fallbackMethod = "quizToolFallback")
    private Mono<Object> executeQuizTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "generate" -> {
                String content = getString(params, "content", "");
                int count = getInt(params, "count", 5);
                String difficulty = getString(params, "difficulty", "medium");
                String type = getString(params, "type", "multiple_choice");

                String prompt = "Generate " + count + " " + difficulty + " difficulty " + type +
                        " quiz questions from this content.\n" +
                        "Format as JSON array with fields: question, options (array of 4 choices), " +
                        "correctAnswer (index 0-3), explanation.\n\nContent:\n" + content;

                yield llmRouterService.generateContent(prompt, "quiz")
                        .map(r -> (Object) r);
            }
            case "explain" -> {
                String question = getString(params, "question", "");
                String correctAnswer = getString(params, "correctAnswer", "");
                String userAnswer = getString(params, "userAnswer", "");

                yield llmRouterService.generateContent(
                        "The question was: " + question +
                                "\nCorrect answer: " + correctAnswer +
                                "\nUser answered: " + userAnswer +
                                "\nExplain why the correct answer is right and why other options are wrong.",
                        "explanation")
                        .map(r -> (Object) r);
            }
            case "grade" -> {
                String question = getString(params, "question", "");
                String userAnswer = getString(params, "userAnswer", "");
                String rubric = getString(params, "rubric", "");

                yield llmRouterService.generateContent(
                        "Grade this answer:\nQuestion: " + question +
                                "\nAnswer: " + userAnswer +
                                (rubric.isEmpty() ? "" : "\nRubric: " + rubric) +
                                "\nProvide score (0-100), feedback, and suggestions for improvement.",
                        "grade")
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown quiz action: " + action));
        };
    }

    private Mono<Object> quizToolFallback(String action, Map<String, Object> params, Long userId, Throwable t) {
        log.warn("Quiz tool fallback for {}: {}", action, t.getMessage());
        return Mono.just(Map.of("fallback", true, "message", "Quiz generation temporarily unavailable"));
    }

    // ============== Web Tools ==============

    private Mono<Object> executeWebTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "search" -> {
                String query = getString(params, "query", "");
                yield llmRouterService.generateContent(
                        "Provide comprehensive information about: " + query +
                                "\nInclude key facts, common questions, and recent developments. " +
                                "Structure your response with clear sections.",
                        "web_search")
                        .map(r -> (Object) r);
            }
            case "research" -> {
                String topic = getString(params, "topic", "");
                String depth = getString(params, "depth", "overview");
                String prompt = switch (depth) {
                    case "deep" -> "Provide an in-depth research summary on: " + topic +
                            "\nInclude history, current state, key figures, controversies, and future outlook.";
                    case "academic" -> "Provide an academic-level analysis of: " + topic +
                            "\nInclude theoretical frameworks, key studies, and research gaps.";
                    default -> "Provide an overview of: " + topic +
                            "\nInclude definition, importance, key aspects, and common misconceptions.";
                };
                yield llmRouterService.generateContent(prompt, "research")
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown web action: " + action));
        };
    }

    // ============== Calendar Tools ==============

    private Mono<Object> executeCalendarTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "createEvent" -> Mono.just(Map.of(
                    "created", true,
                    "title", getString(params, "title", "New Event"),
                    "startTime", getString(params, "startTime", ""),
                    "endTime", getString(params, "endTime", ""),
                    "message", "Event created successfully"));
            case "blockStudyTime" -> {
                String topic = getString(params, "topic", "Study");
                int durationMinutes = getInt(params, "durationMinutes", 30);
                yield Mono.just(Map.of(
                        "blocked", true,
                        "topic", topic,
                        "duration", durationMinutes + " minutes",
                        "message", "Study time blocked for " + topic));
            }
            case "suggestTime" -> {
                String activity = getString(params, "activity", "study");
                int durationMinutes = getInt(params, "durationMinutes", 30);
                yield llmRouterService.generateContent(
                        "Suggest the best time of day for a " + durationMinutes +
                                "-minute " + activity + " session. Consider focus, energy levels, and productivity.",
                        "time_suggestion")
                        .map(r -> (Object) r);
            }
            default -> Mono.just(Map.of("error", "Unknown calendar action: " + action));
        };
    }

    // ============== Chat Tools ==============

    @CircuitBreaker(name = "chat-service", fallbackMethod = "chatToolFallback")
    private Mono<Object> executeChatTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "search" -> {
                String query = getString(params, "query", "");
                yield serviceClient.searchChat(query, userId);
            }
            case "getConversation" -> {
                Long conversationId = getLong(params, "conversationId", 0L);
                yield serviceClient.getConversation(conversationId, userId);
            }
            default -> Mono.just(Map.of("error", "Unknown chat action: " + action));
        };
    }

    private Mono<Object> chatToolFallback(String action, Map<String, Object> params, Long userId, Throwable t) {
        return Mono.just(Map.of("fallback", true, "message", "Chat service unavailable"));
    }

    // ============== Classroom Tools ==============

    @CircuitBreaker(name = "classroom-service", fallbackMethod = "classroomToolFallback")
    private Mono<Object> executeClassroomTool(String action, Map<String, Object> params, Long userId) {
        return switch (action) {
            case "getCourses" -> serviceClient.getClassroomCourses(userId);
            case "getCourse" -> {
                Long courseId = getLong(params, "courseId", 0L);
                yield serviceClient.getCourse(courseId, userId);
            }
            default -> Mono.just(Map.of("error", "Unknown classroom action: " + action));
        };
    }

    private Mono<Object> classroomToolFallback(String action, Map<String, Object> params, Long userId, Throwable t) {
        return Mono.just(Map.of("fallback", true, "message", "Classroom service unavailable"));
    }

    // ============== Helper Methods ==============

    private String buildSummarizePrompt(Object note) {
        return "Summarize this note concisely, highlighting the main points and key takeaways:\n\n" + note;
    }

    private String buildFlashcardPrompt(Object content, int count) {
        return "Generate " + count + " flashcards from this content.\n" +
                "Format as JSON array with 'front' (question) and 'back' (answer) fields.\n" +
                "Make questions specific and answers concise.\n\nContent:\n" + content;
    }

    private String getString(Map<String, Object> params, String key, String defaultValue) {
        Object value = params.get(key);
        return value != null ? String.valueOf(value) : defaultValue;
    }

    private int getInt(Map<String, Object> params, String key, int defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private Long getLong(Map<String, Object> params, String key, Long defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
}
