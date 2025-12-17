package com.muse.ai.agent;

import com.muse.ai.entity.Agent;
import com.muse.ai.service.LLMRouterService;
import com.muse.ai.service.PersonalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;

/**
 * Agent Orchestrator - The Meta-Agent / Personal Assistant
 * Can create, coordinate, and manage multiple agents to complete complex tasks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentOrchestrator {

    private final AgentFactory agentFactory;
    private final LLMRouterService llmRouterService;
    private final PersonalizationService personalizationService;

    /**
     * Process a natural language request and orchestrate agents
     */
    public Mono<OrchestratorResponse> processRequest(String userRequest, Long userId) {
        log.info("Processing request for user {}: {}", userId, userRequest);

        return analyzeRequest(userRequest, userId)
                .flatMap(analysis -> createAgentPlan(analysis, userId))
                .flatMap(this::executeAgentPlan);
    }

    /**
     * Analyze user request to understand intent and required agents
     */
    private Mono<RequestAnalysis> analyzeRequest(String request, Long userId) {
        // Get user context for personalization
        Map<String, Object> userContext = personalizationService.getRecommendations(userId);

        String analysisPrompt = """
                You are an AI assistant planner. Analyze this user request and determine what needs to be done.

                USER REQUEST: %s

                USER CONTEXT:
                - Learning style: %s
                - Topic interests: %s

                Analyze and respond with JSON:
                {
                    "intent": "study_prep" | "research" | "organize" | "schedule" | "quiz" | "write" | "general",
                    "complexity": "simple" | "moderate" | "complex",
                    "requiredAgents": ["RESEARCH", "NOTES", "QUIZ", "SCHEDULE", "TUTOR", "FLASHCARD", "SUMMARY", "WRITING"],
                    "subTasks": [
                        {"description": "Task description", "agentType": "RESEARCH", "priority": 1}
                    ],
                    "estimatedTime": "5min" | "15min" | "30min"
                }

                Choose ONLY the agents that are actually needed. For simple requests, one agent is enough.
                Respond ONLY with valid JSON.
                """
                .formatted(
                        request,
                        userContext.getOrDefault("learningStyle", "visual"),
                        userContext.getOrDefault("topTopics", List.of()));

        return llmRouterService.generateContent(analysisPrompt, "json")
                .map(response -> parseAnalysis(response, request))
                .onErrorResume(e -> {
                    log.error("Analysis failed: {}", e.getMessage());
                    return Mono.just(RequestAnalysis.simple(request));
                });
    }

    private RequestAnalysis parseAnalysis(String response, String originalRequest) {
        // Simplified parsing - in production use Jackson
        RequestAnalysis analysis = new RequestAnalysis();
        analysis.originalRequest = originalRequest;

        try {
            // Basic intent detection from response
            if (response.contains("\"intent\"")) {
                if (response.contains("study_prep"))
                    analysis.intent = "study_prep";
                else if (response.contains("research"))
                    analysis.intent = "research";
                else if (response.contains("organize"))
                    analysis.intent = "organize";
                else if (response.contains("schedule"))
                    analysis.intent = "schedule";
                else if (response.contains("quiz"))
                    analysis.intent = "quiz";
                else
                    analysis.intent = "general";
            }

            // Detect required agents
            analysis.requiredAgents = new ArrayList<>();
            for (AgentTemplate.AgentType type : AgentTemplate.AgentType.values()) {
                if (response.contains("\"" + type.name() + "\"")) {
                    analysis.requiredAgents.add(type);
                }
            }

            // Default to a single appropriate agent if none detected
            if (analysis.requiredAgents.isEmpty()) {
                analysis.requiredAgents.add(detectDefaultAgent(originalRequest));
            }

        } catch (Exception e) {
            log.warn("Failed to parse analysis, using defaults");
            analysis.intent = "general";
            analysis.requiredAgents = List.of(detectDefaultAgent(originalRequest));
        }

        return analysis;
    }

    private AgentTemplate.AgentType detectDefaultAgent(String request) {
        String lower = request.toLowerCase();

        if (lower.contains("research") || lower.contains("find") || lower.contains("search")) {
            return AgentTemplate.AgentType.RESEARCH;
        } else if (lower.contains("quiz") || lower.contains("test") || lower.contains("practice")) {
            return AgentTemplate.AgentType.QUIZ;
        } else if (lower.contains("schedule") || lower.contains("plan") || lower.contains("calendar")) {
            return AgentTemplate.AgentType.SCHEDULE;
        } else if (lower.contains("summarize") || lower.contains("summary")) {
            return AgentTemplate.AgentType.SUMMARY;
        } else if (lower.contains("flashcard") || lower.contains("memorize")) {
            return AgentTemplate.AgentType.FLASHCARD;
        } else if (lower.contains("write") || lower.contains("essay") || lower.contains("draft")) {
            return AgentTemplate.AgentType.WRITING;
        } else if (lower.contains("explain") || lower.contains("teach") || lower.contains("learn")) {
            return AgentTemplate.AgentType.TUTOR;
        } else if (lower.contains("note") || lower.contains("organize")) {
            return AgentTemplate.AgentType.NOTES;
        }

        return AgentTemplate.AgentType.TUTOR; // Default to tutor for general questions
    }

    /**
     * Create a plan of agents to execute
     */
    private Mono<AgentPlan> createAgentPlan(RequestAnalysis analysis, Long userId) {
        AgentPlan plan = new AgentPlan();
        plan.userId = userId;
        plan.analysis = analysis;
        plan.agents = new ArrayList<>();

        // Create agents based on analysis
        for (AgentTemplate.AgentType type : analysis.requiredAgents) {
            String goal = analysis.originalRequest;
            Agent agent = agentFactory.createFromTemplate(type, goal, userId, null);
            plan.agents.add(agent);
        }

        log.info("Created plan with {} agents for request: {}",
                plan.agents.size(), analysis.originalRequest);

        return Mono.just(plan);
    }

    /**
     * Execute the agent plan (run agents in order or parallel based on
     * dependencies)
     */
    private Mono<OrchestratorResponse> executeAgentPlan(AgentPlan plan) {
        OrchestratorResponse response = new OrchestratorResponse();
        response.requestId = UUID.randomUUID();
        response.originalRequest = plan.analysis.originalRequest;
        response.agents = new ArrayList<>();

        // Execute agents (for now, sequentially)
        List<Mono<Agent>> agentExecutions = new ArrayList<>();

        for (Agent agent : plan.agents) {
            agentExecutions.add(agentFactory.executeAgent(agent.getId()));
        }

        // Use Mono.zip to execute all and collect results
        if (agentExecutions.isEmpty()) {
            response.status = "completed";
            response.summary = "No agents needed for this request.";
            return Mono.just(response);
        }

        return Mono.zip(agentExecutions, results -> {
            for (Object result : results) {
                if (result instanceof Agent agent) {
                    response.agents.add(AgentResult.from(agent));
                }
            }
            response.status = "completed";
            response.summary = generateSummary(response);
            return response;
        }).onErrorResume(e -> {
            response.status = "failed";
            response.error = e.getMessage();
            response.summary = "Some agents failed to complete.";
            return Mono.just(response);
        });
    }

    private String generateSummary(OrchestratorResponse response) {
        int completed = (int) response.agents.stream()
                .filter(a -> "COMPLETED".equals(a.status))
                .count();

        return String.format("Completed %d of %d agents successfully.",
                completed, response.agents.size());
    }

    // Inner classes

    private static class RequestAnalysis {
        String originalRequest;
        String intent;
        List<AgentTemplate.AgentType> requiredAgents;
        String complexity;

        static RequestAnalysis simple(String request) {
            RequestAnalysis a = new RequestAnalysis();
            a.originalRequest = request;
            a.intent = "general";
            a.requiredAgents = List.of(AgentTemplate.AgentType.TUTOR);
            a.complexity = "simple";
            return a;
        }
    }

    private static class AgentPlan {
        Long userId;
        RequestAnalysis analysis;
        List<Agent> agents;
    }

    @lombok.Data
    public static class OrchestratorResponse {
        UUID requestId;
        String originalRequest;
        String status;
        String summary;
        String error;
        List<AgentResult> agents;
    }

    @lombok.Data
    public static class AgentResult {
        UUID agentId;
        String type;
        String status;
        int progress;
        Map<String, Object> result;

        static AgentResult from(Agent agent) {
            AgentResult r = new AgentResult();
            r.agentId = agent.getId();
            r.type = agent.getType();
            r.status = agent.getStatus();
            r.progress = "COMPLETED".equals(agent.getStatus()) ? 100 : 0;
            r.result = agent.getResult();
            return r;
        }
    }
}
