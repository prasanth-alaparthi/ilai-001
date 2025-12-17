package com.muse.ai.agent;

import com.muse.ai.entity.Agent;
import com.muse.ai.repository.AgentRepository;
import com.muse.ai.service.LLMRouterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent Factory - Creates and manages specialized agents
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentFactory {

    private final AgentRepository agentRepository;
    private final LLMRouterService llmRouterService;
    private final Map<UUID, AgentExecution> activeAgents = new ConcurrentHashMap<>();

    /**
     * Create an agent from a template
     */
    public Agent createFromTemplate(AgentTemplate.AgentType type, String goal,
            Long userId, Map<String, Object> customConfig) {
        AgentTemplate template = AgentTemplate.getTemplate(type);

        Map<String, Object> config = new HashMap<>(template.getDefaultConfig());
        if (customConfig != null) {
            config.putAll(customConfig);
        }

        Agent agent = Agent.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .type(type.name())
                .goal(goal)
                .tools(template.getDefaultTools())
                .status("PENDING")
                .createdAt(Instant.now())
                .build();

        return agentRepository.save(agent);
    }

    /**
     * Create a custom agent with specific tools
     */
    public Agent createCustomAgent(String goal, List<String> tools, Long userId) {
        Agent agent = Agent.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .type("CUSTOM")
                .goal(goal)
                .tools(tools)
                .status("PENDING")
                .createdAt(Instant.now())
                .build();

        return agentRepository.save(agent);
    }

    /**
     * Execute an agent asynchronously
     */
    public Mono<Agent> executeAgent(UUID agentId) {
        return Mono.fromSupplier(() -> agentRepository.findById(agentId).orElseThrow())
                .flatMap(agent -> {
                    agent.setStatus("RUNNING");
                    agent.setStartedAt(Instant.now());
                    agentRepository.save(agent);

                    AgentExecution execution = new AgentExecution(agent, this);
                    activeAgents.put(agentId, execution);

                    return execution.run()
                            .map(result -> {
                                agent.setStatus("COMPLETED");
                                agent.setResult(result);
                                agent.setCompletedAt(Instant.now());
                                activeAgents.remove(agentId);
                                return agentRepository.save(agent);
                            })
                            .onErrorResume(e -> {
                                agent.setStatus("FAILED");
                                agent.setResult(Map.of("error", e.getMessage()));
                                agent.setCompletedAt(Instant.now());
                                activeAgents.remove(agentId);
                                return Mono.just(agentRepository.save(agent));
                            });
                });
    }

    /**
     * Execute an agent with SSE event streaming (Phase 2)
     * Emits AgentEvents to the provided sink for real-time updates
     */
    public Mono<Agent> executeAgentWithEvents(UUID agentId, reactor.core.publisher.Sinks.Many<AgentEvent> eventSink) {
        return Mono.fromSupplier(() -> agentRepository.findById(agentId).orElseThrow())
                .flatMap(agent -> {
                    // Emit started event
                    eventSink.tryEmitNext(AgentEvent.started("Agent " + agent.getType() + " started"));

                    agent.setStatus("RUNNING");
                    agent.setStartedAt(Instant.now());
                    agentRepository.save(agent);

                    // Emit thinking event
                    eventSink.tryEmitNext(AgentEvent.thinking("Analyzing task: " + agent.getGoal()));

                    AgentExecution execution = new AgentExecution(agent, this);
                    activeAgents.put(agentId, execution);

                    // Emit progress for each tool
                    int toolCount = agent.getTools().size();
                    int i = 0;
                    for (String tool : agent.getTools()) {
                        int progress = (int) ((i + 1) * 80.0 / toolCount);
                        eventSink.tryEmitNext(AgentEvent.toolCall(tool, "Executing " + tool));
                        i++;
                    }

                    return execution.run()
                            .map(result -> {
                                agent.setStatus("COMPLETED");
                                agent.setResult(result);
                                agent.setCompletedAt(Instant.now());
                                activeAgents.remove(agentId);

                                eventSink.tryEmitNext(AgentEvent.progress(100, "All tasks completed"));
                                return agentRepository.save(agent);
                            })
                            .onErrorResume(e -> {
                                agent.setStatus("FAILED");
                                agent.setResult(Map.of("error", e.getMessage()));
                                agent.setCompletedAt(Instant.now());
                                activeAgents.remove(agentId);

                                eventSink.tryEmitNext(AgentEvent.error(e.getMessage()));
                                return Mono.just(agentRepository.save(agent));
                            });
                });
    }

    /**
     * Get agent status
     */
    public AgentStatus getStatus(UUID agentId) {
        Agent agent = agentRepository.findById(agentId).orElse(null);
        if (agent == null)
            return null;

        AgentExecution execution = activeAgents.get(agentId);

        return AgentStatus.builder()
                .agentId(agentId)
                .status(agent.getStatus())
                .progress(execution != null ? execution.getProgress() : agent.getStatus().equals("COMPLETED") ? 100 : 0)
                .steps(execution != null ? execution.getSteps() : List.of())
                .result(agent.getResult())
                .startedAt(agent.getStartedAt())
                .completedAt(agent.getCompletedAt())
                .build();
    }

    /**
     * Cancel an agent
     */
    public boolean cancelAgent(UUID agentId) {
        AgentExecution execution = activeAgents.get(agentId);
        if (execution != null) {
            execution.cancel();
            activeAgents.remove(agentId);

            Agent agent = agentRepository.findById(agentId).orElse(null);
            if (agent != null) {
                agent.setStatus("CANCELLED");
                agent.setCompletedAt(Instant.now());
                agentRepository.save(agent);
            }
            return true;
        }
        return false;
    }

    /**
     * Get all active agents for a user
     */
    public List<AgentStatus> getActiveAgents(Long userId) {
        return agentRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "RUNNING").stream()
                .map(agent -> getStatus(agent.getId()))
                .filter(Objects::nonNull)
                .toList();
    }

    public LLMRouterService getLlmService() {
        return llmRouterService;
    }

    // Inner classes

    @lombok.Data
    @lombok.Builder
    public static class AgentStatus {
        private UUID agentId;
        private String status;
        private int progress;
        private List<AgentStep> steps;
        private Map<String, Object> result;
        private Instant startedAt;
        private Instant completedAt;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class AgentStep {
        private String tool;
        private String description;
        private String status; // pending, running, completed, failed
        private Map<String, Object> input;
        private Object output;
        private Instant timestamp;
    }
}
