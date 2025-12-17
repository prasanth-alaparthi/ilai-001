package com.muse.ai.agent;

import com.muse.ai.service.LLMRouterService;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * ReAct Agent - Reasoning + Acting pattern
 * The agent observes, thinks, acts in a loop until goal is achieved
 * 
 * Pattern:
 * 1. THINK: LLM analyzes current state and decides next action
 * 2. ACT: Execute the chosen tool
 * 3. OBSERVE: LLM interprets the result
 * 4. Repeat until COMPLETE or MAX_ITERATIONS
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReActAgent {

    private final ToolExecutor toolExecutor;
    private final LLMRouterService llmRouterService;

    private static final int MAX_ITERATIONS = 10;
    private static final int MAX_CONTEXT_TOKENS = 4000;

    /**
     * Run the ReAct loop to achieve a goal
     */
    public Mono<AgentResult> run(String goal, Long userId) {
        return run(goal, userId, new AgentContext());
    }

    public Mono<AgentResult> run(String goal, Long userId, AgentContext context) {
        log.info("Starting ReAct agent for user {}: {}", userId, goal);

        AgentState state = AgentState.builder()
                .goal(goal)
                .userId(userId)
                .context(context)
                .steps(new ArrayList<>())
                .startTime(Instant.now())
                .build();

        return iterate(state, 0);
    }

    /**
     * Main iteration loop
     */
    private Mono<AgentResult> iterate(AgentState state, int iteration) {
        if (iteration >= MAX_ITERATIONS) {
            log.warn("Agent reached max iterations for goal: {}", state.goal);
            return Mono.just(buildResult(state, "max_iterations"));
        }

        // Step 1: THINK - Decide what to do next
        return think(state)
                .flatMap(thought -> {
                    state.steps.add(ReActStep.builder()
                            .type("thought")
                            .content(thought.reasoning)
                            .timestamp(Instant.now())
                            .build());

                    // Check if agent decided to complete
                    if ("COMPLETE".equals(thought.action)) {
                        log.info("Agent completed goal: {}", state.goal);
                        state.finalAnswer = thought.answer;
                        return Mono.just(buildResult(state, "completed"));
                    }

                    // Step 2: ACT - Execute the chosen tool
                    return act(state, thought)
                            .flatMap(actionResult -> {
                                state.steps.add(ReActStep.builder()
                                        .type("action")
                                        .tool(thought.action)
                                        .input(thought.input)
                                        .output(actionResult)
                                        .timestamp(Instant.now())
                                        .build());

                                // Step 3: OBSERVE - Interpret the result
                                return observe(state, thought, actionResult)
                                        .flatMap(observation -> {
                                            state.steps.add(ReActStep.builder()
                                                    .type("observation")
                                                    .content(observation)
                                                    .timestamp(Instant.now())
                                                    .build());

                                            // Continue loop
                                            return iterate(state, iteration + 1);
                                        });
                            });
                })
                .onErrorResume(e -> {
                    log.error("ReAct error at iteration {}: {}", iteration, e.getMessage());
                    state.error = e.getMessage();
                    return Mono.just(buildResult(state, "error"));
                });
    }

    /**
     * THINK phase - LLM decides next action
     */
    private Mono<Thought> think(AgentState state) {
        String prompt = buildThinkPrompt(state);

        return llmRouterService.generateContent(prompt, "json")
                .map(response -> parseThought(response))
                .onErrorResume(e -> {
                    log.error("Think phase failed: {}", e.getMessage());
                    // Fallback: complete with error
                    return Mono.just(Thought.builder()
                            .action("COMPLETE")
                            .answer("I encountered an error while thinking: " + e.getMessage())
                            .reasoning("Error occurred")
                            .build());
                });
    }

    private String buildThinkPrompt(AgentState state) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an AI agent using the ReAct (Reasoning + Acting) pattern.\n\n");
        sb.append("GOAL: ").append(state.goal).append("\n\n");

        // Add available tools
        sb.append("AVAILABLE TOOLS:\n");
        for (ToolRegistry.Tool tool : ToolRegistry.getAllTools()) {
            sb.append("- ").append(tool.getName()).append(": ").append(tool.getDescription())
                    .append(" (params: ").append(tool.getParameters()).append(")\n");
        }
        sb.append("- COMPLETE: Finish and provide final answer\n\n");

        // Add conversation history (compressed)
        if (!state.steps.isEmpty()) {
            sb.append("PREVIOUS STEPS:\n");
            int startIdx = Math.max(0, state.steps.size() - 6); // Last 6 steps
            for (int i = startIdx; i < state.steps.size(); i++) {
                ReActStep step = state.steps.get(i);
                sb.append(i + 1).append(". [").append(step.type.toUpperCase()).append("] ");
                if (step.tool != null) {
                    sb.append(step.tool).append(" -> ");
                }
                sb.append(truncate(
                        step.content != null ? step.content : (step.output != null ? step.output.toString() : ""),
                        200));
                sb.append("\n");
            }
            sb.append("\n");
        }

        // Add context
        if (state.context != null && !state.context.facts.isEmpty()) {
            sb.append("KNOWN FACTS:\n");
            for (String fact : state.context.facts) {
                sb.append("- ").append(fact).append("\n");
            }
            sb.append("\n");
        }

        sb.append("Based on the goal and previous steps, decide your next action.\n\n");
        sb.append("Respond with JSON:\n");
        sb.append("{\n");
        sb.append("  \"reasoning\": \"Your step-by-step reasoning\",\n");
        sb.append("  \"action\": \"tool.name OR COMPLETE\",\n");
        sb.append("  \"input\": {\"param1\": \"value1\"},\n");
        sb.append("  \"answer\": \"Final answer (only if action is COMPLETE)\"\n");
        sb.append("}\n\n");
        sb.append("IMPORTANT: Choose COMPLETE when you have enough information to answer the goal.");

        return sb.toString();
    }

    private Thought parseThought(String response) {
        try {
            // Simple JSON parsing (would use Jackson in production)
            String reasoning = extractJsonField(response, "reasoning");
            String action = extractJsonField(response, "action");
            String answer = extractJsonField(response, "answer");

            Map<String, Object> input = new HashMap<>();
            // Extract input parameters
            int inputStart = response.indexOf("\"input\"");
            if (inputStart > 0) {
                int braceStart = response.indexOf("{", inputStart);
                int braceEnd = findMatchingBrace(response, braceStart);
                if (braceStart > 0 && braceEnd > braceStart) {
                    String inputJson = response.substring(braceStart, braceEnd + 1);
                    // Simple extraction of key-value pairs
                    String[] pairs = inputJson.replaceAll("[{}\"\\s]", "").split(",");
                    for (String pair : pairs) {
                        String[] kv = pair.split(":");
                        if (kv.length == 2) {
                            input.put(kv[0].trim(), kv[1].trim());
                        }
                    }
                }
            }

            return Thought.builder()
                    .reasoning(reasoning)
                    .action(action != null ? action : "COMPLETE")
                    .input(input)
                    .answer(answer)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse thought, defaulting to COMPLETE: {}", e.getMessage());
            return Thought.builder()
                    .action("COMPLETE")
                    .reasoning("Parse error")
                    .answer("I was unable to determine the next action.")
                    .build();
        }
    }

    /**
     * ACT phase - Execute the chosen tool
     */
    private Mono<Object> act(AgentState state, Thought thought) {
        String toolName = thought.action;
        Map<String, Object> input = thought.input != null ? thought.input : Map.of();

        log.info("Agent executing tool: {} with input: {}", toolName, input);

        return toolExecutor.execute(toolName, input, state.userId);
    }

    /**
     * OBSERVE phase - LLM interprets the tool result
     */
    private Mono<String> observe(AgentState state, Thought thought, Object result) {
        String prompt = String.format("""
                You are observing the result of an action.

                GOAL: %s
                ACTION: %s
                INPUT: %s
                RESULT: %s

                Provide a brief observation (1-2 sentences) about what you learned from this result.
                Focus on how it helps (or doesn't help) achieve the goal.
                """,
                state.goal,
                thought.action,
                thought.input,
                truncate(result.toString(), 500));

        return llmRouterService.generateContent(prompt, null)
                .map(obs -> truncate(obs, 300))
                .onErrorResume(e -> Mono.just("Observation failed: " + e.getMessage()));
    }

    /**
     * Build final result
     */
    private AgentResult buildResult(AgentState state, String status) {
        long durationMs = Instant.now().toEpochMilli() - state.startTime.toEpochMilli();

        return AgentResult.builder()
                .goal(state.goal)
                .status(status)
                .answer(state.finalAnswer)
                .steps(state.steps)
                .totalSteps(state.steps.size())
                .durationMs(durationMs)
                .error(state.error)
                .build();
    }

    // ============== Helper Methods ==============

    private String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\"\\s*:\\s*\"";
        int start = json.indexOf(pattern);
        if (start < 0)
            return null;
        start += pattern.length() - 1;
        int end = json.indexOf("\"", start + 1);
        if (end < 0)
            return null;
        return json.substring(start + 1, end);
    }

    private int findMatchingBrace(String s, int start) {
        if (start < 0 || s.charAt(start) != '{')
            return -1;
        int depth = 0;
        for (int i = start; i < s.length(); i++) {
            if (s.charAt(i) == '{')
                depth++;
            if (s.charAt(i) == '}')
                depth--;
            if (depth == 0)
                return i;
        }
        return -1;
    }

    private String truncate(String s, int maxLen) {
        if (s == null)
            return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }

    // ============== Data Classes ==============

    @Data
    @Builder
    public static class AgentState {
        private String goal;
        private Long userId;
        private AgentContext context;
        private List<ReActStep> steps;
        private String finalAnswer;
        private String error;
        private Instant startTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentContext {
        @Builder.Default
        private List<String> facts = new ArrayList<>();
        @Builder.Default
        private Map<String, Object> memory = new HashMap<>();
    }

    @Data
    @Builder
    public static class Thought {
        private String reasoning;
        private String action;
        private Map<String, Object> input;
        private String answer;
    }

    @Data
    @Builder
    public static class ReActStep {
        private String type; // "thought", "action", "observation"
        private String content;
        private String tool;
        private Map<String, Object> input;
        private Object output;
        private Instant timestamp;
    }

    @Data
    @Builder
    public static class AgentResult {
        private String goal;
        private String status; // "completed", "max_iterations", "error"
        private String answer;
        private List<ReActStep> steps;
        private int totalSteps;
        private long durationMs;
        private String error;
    }
}
