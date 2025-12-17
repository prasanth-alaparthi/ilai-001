package com.muse.ai.agent;

import com.muse.ai.entity.Agent;
import com.muse.ai.service.LLMRouterService;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Agent Execution - Runs a specific agent with its tools
 */
@Slf4j
public class AgentExecution {

    private final Agent agent;
    private final AgentFactory factory;
    private final AtomicBoolean cancelled = new AtomicBoolean(false);
    private final AtomicInteger progress = new AtomicInteger(0);
    @Getter
    private final List<AgentFactory.AgentStep> steps = new ArrayList<>();

    public AgentExecution(Agent agent, AgentFactory factory) {
        this.agent = agent;
        this.factory = factory;
    }

    /**
     * Run the agent with planning and execution
     */
    public Mono<Map<String, Object>> run() {
        return planExecution()
                .flatMap(this::executeSteps)
                .map(this::aggregateResults);
    }

    /**
     * Plan execution steps based on goal and available tools
     */
    private Mono<List<AgentFactory.AgentStep>> planExecution() {
        String planPrompt = buildPlanPrompt();

        return factory.getLlmService().generateContent(planPrompt, "json")
                .map(response -> {
                    List<AgentFactory.AgentStep> plannedSteps = parsePlan(response);
                    steps.addAll(plannedSteps);
                    log.info("Agent {} planned {} steps", agent.getId(), plannedSteps.size());
                    return plannedSteps;
                })
                .onErrorResume(e -> {
                    log.error("Planning failed for agent {}: {}", agent.getId(), e.getMessage());
                    // Fallback: create simple execution plan
                    return Mono.just(createFallbackPlan());
                });
    }

    private String buildPlanPrompt() {
        AgentTemplate template = AgentTemplate.getTemplate(
                AgentTemplate.AgentType.valueOf(agent.getType()));

        String toolsDescription = agent.getTools().stream()
                .map(toolName -> {
                    ToolRegistry.Tool tool = ToolRegistry.getTool(toolName);
                    return tool != null ? String.format("- %s: %s (params: %s)",
                            tool.getName(), tool.getDescription(), tool.getParameters()) : "- " + toolName;
                })
                .reduce((a, b) -> a + "\n" + b)
                .orElse("No tools available");

        return """
                You are an AI agent planner. Create a step-by-step plan to achieve the goal.

                GOAL: %s

                AVAILABLE TOOLS:
                %s

                RULES:
                1. Use only the available tools
                2. Break down the goal into specific, actionable steps
                3. Each step should use exactly one tool
                4. Order steps logically (dependencies first)

                Respond with a JSON array of steps:
                [
                    {"tool": "tool.name", "description": "What this step does", "input": {"param": "value"}}
                ]

                Respond ONLY with valid JSON, no explanation.
                """.formatted(agent.getGoal(), toolsDescription);
    }

    private List<AgentFactory.AgentStep> parsePlan(String response) {
        List<AgentFactory.AgentStep> plannedSteps = new ArrayList<>();

        try {
            // Parse JSON response (simplified - would use Jackson in production)
            // For now, create basic steps based on tools
            for (String toolName : agent.getTools()) {
                ToolRegistry.Tool tool = ToolRegistry.getTool(toolName);
                if (tool != null) {
                    plannedSteps.add(AgentFactory.AgentStep.builder()
                            .tool(toolName)
                            .description(tool.getDescription())
                            .status("pending")
                            .input(Map.of())
                            .timestamp(Instant.now())
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse plan, using fallback: {}", e.getMessage());
            return createFallbackPlan();
        }

        return plannedSteps;
    }

    private List<AgentFactory.AgentStep> createFallbackPlan() {
        List<AgentFactory.AgentStep> fallbackSteps = new ArrayList<>();

        // Create one step per tool
        for (String toolName : agent.getTools()) {
            ToolRegistry.Tool tool = ToolRegistry.getTool(toolName);
            fallbackSteps.add(AgentFactory.AgentStep.builder()
                    .tool(toolName)
                    .description(tool != null ? tool.getDescription() : "Execute " + toolName)
                    .status("pending")
                    .input(Map.of("query", agent.getGoal()))
                    .timestamp(Instant.now())
                    .build());
        }

        return fallbackSteps;
    }

    /**
     * Execute planned steps
     */
    private Mono<List<AgentFactory.AgentStep>> executeSteps(List<AgentFactory.AgentStep> plannedSteps) {
        if (cancelled.get()) {
            return Mono.just(plannedSteps);
        }

        return Mono.defer(() -> {
            List<AgentFactory.AgentStep> executedSteps = new ArrayList<>();

            for (int i = 0; i < plannedSteps.size() && !cancelled.get(); i++) {
                AgentFactory.AgentStep step = plannedSteps.get(i);
                step.setStatus("running");

                try {
                    Object result = executeTool(step);
                    step.setOutput(result);
                    step.setStatus("completed");
                } catch (Exception e) {
                    step.setOutput(Map.of("error", e.getMessage()));
                    step.setStatus("failed");
                    log.error("Step {} failed: {}", step.getTool(), e.getMessage());
                }

                executedSteps.add(step);
                progress.set((int) ((i + 1.0) / plannedSteps.size() * 100));
            }

            return Mono.just(executedSteps);
        });
    }

    /**
     * Execute a single tool
     */
    private Object executeTool(AgentFactory.AgentStep step) {
        String toolName = step.getTool();
        Map<String, Object> input = step.getInput();

        // Route to appropriate service based on tool category
        String category = toolName.split("\\.")[0];

        return switch (category) {
            case "ai" -> executeAiTool(toolName, input);
            case "notes" -> Map.of("result", "Notes tool executed: " + toolName, "input", input);
            case "feed" -> Map.of("result", "Feed tool executed: " + toolName, "input", input);
            case "calendar" -> Map.of("result", "Calendar tool executed: " + toolName, "input", input);
            case "quiz" -> Map.of("result", "Quiz tool executed: " + toolName, "input", input);
            case "journal" -> Map.of("result", "Journal tool executed: " + toolName, "input", input);
            case "web" -> Map.of("result", "Web tool executed: " + toolName, "input", input);
            case "study" -> Map.of("result", "Study tool executed: " + toolName, "input", input);
            case "chat" -> Map.of("result", "Chat tool executed: " + toolName, "input", input);
            default -> Map.of("error", "Unknown tool category: " + category);
        };
    }

    private Object executeAiTool(String toolName, Map<String, Object> input) {
        String action = toolName.substring(3); // Remove "ai."
        String content = (String) input.getOrDefault("content", input.getOrDefault("prompt", ""));

        return switch (action) {
            case "summarize" -> factory.getLlmService().summarize(content).block();
            case "explain" -> factory.getLlmService().explain(content,
                    (String) input.getOrDefault("level", "simple")).block();
            case "generate" -> factory.getLlmService().generateContent(content, null).block();
            default -> Map.of("error", "Unknown AI action: " + action);
        };
    }

    /**
     * Aggregate results from all steps
     */
    private Map<String, Object> aggregateResults(List<AgentFactory.AgentStep> executedSteps) {
        Map<String, Object> results = new HashMap<>();

        List<Object> stepResults = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (AgentFactory.AgentStep step : executedSteps) {
            stepResults.add(Map.of(
                    "tool", step.getTool(),
                    "status", step.getStatus(),
                    "output", step.getOutput() != null ? step.getOutput() : Map.of()));

            if ("completed".equals(step.getStatus())) {
                successCount++;
            } else if ("failed".equals(step.getStatus())) {
                failCount++;
            }
        }

        results.put("steps", stepResults);
        results.put("totalSteps", executedSteps.size());
        results.put("successCount", successCount);
        results.put("failCount", failCount);
        results.put("cancelled", cancelled.get());

        return results;
    }

    public int getProgress() {
        return progress.get();
    }

    public void cancel() {
        cancelled.set(true);
    }
}
