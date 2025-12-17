package com.muse.ai.controller;

import com.muse.ai.agent.*;
import com.muse.ai.entity.Agent;
import com.muse.ai.repository.AgentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.util.*;

/**
 * Agent Controller - API for agent management and personal assistant
 * Phase 2: Added SSE streaming and enhanced tool execution
 */
@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
@Slf4j
public class AgentController {

    private final AgentFactory agentFactory;
    private final AgentOrchestrator orchestrator;
    private final AgentRepository agentRepository;
    private final ToolExecutor toolExecutor;

    // ============== Personal Assistant ==============

    /**
     * Process a natural language request with the personal assistant
     * This is the main entry point for the AI assistant
     */
    @PostMapping("/assistant")
    public Mono<ResponseEntity<AgentOrchestrator.OrchestratorResponse>> askAssistant(
            @RequestBody AssistantRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());

        return orchestrator.processRequest(request.message(), userId)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError().build()));
    }

    // ============== SSE Streaming (Phase 2) ==============

    /**
     * Stream agent execution events in real-time via SSE
     * Provides "Thinking...", "Searching...", progress updates
     */
    @GetMapping(value = "/stream/{agentId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<AgentEvent>> streamAgentEvents(
            @PathVariable UUID agentId,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());
        log.info("Starting SSE stream for agent {} by user {}", agentId, userId);

        // Create a sink for streaming events
        Sinks.Many<AgentEvent> sink = Sinks.many().multicast().onBackpressureBuffer();

        // Start agent execution and emit events
        agentFactory.executeAgentWithEvents(agentId, sink)
                .subscribe(
                        agent -> sink.tryEmitNext(AgentEvent.complete("Agent completed", agent.getResult())),
                        error -> sink.tryEmitNext(AgentEvent.error(error.getMessage())),
                        sink::tryEmitComplete);

        // Stream events to client
        return sink.asFlux()
                .map(event -> ServerSentEvent.<AgentEvent>builder()
                        .id(UUID.randomUUID().toString())
                        .event(event.getType().name().toLowerCase())
                        .data(event)
                        .build())
                .timeout(Duration.ofMinutes(5))
                .onErrorResume(e -> {
                    log.error("SSE stream error: {}", e.getMessage());
                    return Flux.just(ServerSentEvent.<AgentEvent>builder()
                            .event("error")
                            .data(AgentEvent.error(e.getMessage()))
                            .build());
                });
    }

    /**
     * Stream assistant response in real-time
     * Main SSE endpoint for the AI chat
     */
    @PostMapping(value = "/assistant/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<AgentEvent>> streamAssistant(
            @RequestBody AssistantRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());
        log.info("Starting streaming assistant for user {}: {}", userId, request.message());

        return Flux.create(sink -> {
            // Emit start event
            sink.next(ServerSentEvent.<AgentEvent>builder()
                    .event("started")
                    .data(AgentEvent.started("Processing your request..."))
                    .build());

            // Emit thinking event
            sink.next(ServerSentEvent.<AgentEvent>builder()
                    .event("thinking")
                    .data(AgentEvent.thinking("Analyzing your request..."))
                    .build());

            // Process the request
            orchestrator.processRequest(request.message(), userId)
                    .subscribe(
                            response -> {
                                sink.next(ServerSentEvent.<AgentEvent>builder()
                                        .event("complete")
                                        .data(AgentEvent.complete(response.getSummary(),
                                                Map.of("response", response)))
                                        .build());
                                sink.complete();
                            },
                            error -> {
                                sink.next(ServerSentEvent.<AgentEvent>builder()
                                        .event("error")
                                        .data(AgentEvent.error(error.getMessage()))
                                        .build());
                                sink.complete();
                            });
        });
    }

    /**
     * Execute a specific tool and stream results
     */
    @PostMapping(value = "/tools/execute", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<AgentEvent>> executeToolStream(
            @RequestBody ToolExecuteRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());
        log.info("Executing tool {} for user {}", request.toolName(), userId);

        return Flux.create(sink -> {
            // Emit tool call event
            sink.next(ServerSentEvent.<AgentEvent>builder()
                    .event("tool_call")
                    .data(AgentEvent.toolCall(request.toolName(), "Executing " + request.toolName()))
                    .build());

            // Execute tool
            toolExecutor.execute(request.toolName(), request.params(), userId)
                    .subscribe(
                            result -> {
                                sink.next(ServerSentEvent.<AgentEvent>builder()
                                        .event("tool_result")
                                        .data(AgentEvent.toolResult(request.toolName(),
                                                Map.of("result", result)))
                                        .build());
                                sink.complete();
                            },
                            error -> {
                                sink.next(ServerSentEvent.<AgentEvent>builder()
                                        .event("error")
                                        .data(AgentEvent.error(error.getMessage()))
                                        .build());
                                sink.complete();
                            });
        });
    }

    // ============== Agent Templates ==============

    /**
     * Get all available agent templates
     */
    @GetMapping("/templates")
    public ResponseEntity<List<AgentTemplateDTO>> getTemplates() {
        List<AgentTemplateDTO> templates = AgentTemplate.getAllTemplates().stream()
                .map(t -> new AgentTemplateDTO(
                        t.getId(), t.getName(), t.getDescription(),
                        t.getIcon(), t.getType().name(), t.getDefaultTools()))
                .toList();
        return ResponseEntity.ok(templates);
    }

    // ============== Agent Creation ==============

    /**
     * Create an agent from a template
     */
    @PostMapping
    public ResponseEntity<AgentDTO> createAgent(
            @RequestBody CreateAgentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());

        AgentTemplate.AgentType type = AgentTemplate.AgentType.valueOf(
                request.type().toUpperCase());

        Agent agent = agentFactory.createFromTemplate(type, request.goal(), userId, request.config());

        return ResponseEntity.ok(AgentDTO.from(agent));
    }

    /**
     * Create a custom agent with specific tools
     */
    @PostMapping("/custom")
    public ResponseEntity<AgentDTO> createCustomAgent(
            @RequestBody CreateCustomAgentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());

        Agent agent = agentFactory.createCustomAgent(request.goal(), request.tools(), userId);

        return ResponseEntity.ok(AgentDTO.from(agent));
    }

    // ============== Agent Execution ==============

    /**
     * Execute an agent
     */
    @PostMapping("/{agentId}/execute")
    public Mono<ResponseEntity<AgentDTO>> executeAgent(
            @PathVariable UUID agentId,
            @AuthenticationPrincipal Jwt jwt) {

        return agentFactory.executeAgent(agentId)
                .map(agent -> ResponseEntity.ok(AgentDTO.from(agent)))
                .onErrorResume(e -> Mono.just(ResponseEntity.notFound().build()));
    }

    /**
     * Get agent status
     */
    @GetMapping("/{agentId}/status")
    public ResponseEntity<AgentFactory.AgentStatus> getAgentStatus(
            @PathVariable UUID agentId) {

        AgentFactory.AgentStatus status = agentFactory.getStatus(agentId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Cancel an agent
     */
    @PostMapping("/{agentId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelAgent(
            @PathVariable UUID agentId) {

        boolean cancelled = agentFactory.cancelAgent(agentId);
        return ResponseEntity.ok(Map.of("cancelled", cancelled));
    }

    // ============== Agent Queries ==============

    /**
     * Get all active agents for current user
     */
    @GetMapping("/active")
    public ResponseEntity<List<AgentFactory.AgentStatus>> getActiveAgents(
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.parseLong(jwt.getSubject());
        List<AgentFactory.AgentStatus> agents = agentFactory.getActiveAgents(userId);
        return ResponseEntity.ok(agents);
    }

    /**
     * Get agent history for current user
     */
    @GetMapping("/history")
    public ResponseEntity<List<AgentDTO>> getAgentHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "10") int limit) {

        Long userId = Long.parseLong(jwt.getSubject());
        List<AgentDTO> history = agentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(limit)
                .map(AgentDTO::from)
                .toList();
        return ResponseEntity.ok(history);
    }

    // ============== Tool Registry ==============

    /**
     * Get all available tools
     */
    @GetMapping("/tools")
    public ResponseEntity<Map<String, Object>> getTools() {
        return ResponseEntity.ok(Map.of(
                "tools", ToolRegistry.getAllTools(),
                "categories", ToolRegistry.getToolsByCategories().keySet()));
    }

    /**
     * Get tools by category
     */
    @GetMapping("/tools/{category}")
    public ResponseEntity<List<ToolRegistry.Tool>> getToolsByCategory(
            @PathVariable String category) {
        return ResponseEntity.ok(ToolRegistry.getToolsByCategory(category));
    }

    // ============== DTOs ==============

    record AssistantRequest(String message) {
    }

    record CreateAgentRequest(String type, String goal, Map<String, Object> config) {
    }

    record CreateCustomAgentRequest(String goal, List<String> tools) {
    }

    record ToolExecuteRequest(String toolName, Map<String, Object> params) {
    }

    record AgentTemplateDTO(String id, String name, String description,
            String icon, String type, List<String> tools) {
    }

    record AgentDTO(UUID id, String type, String goal, String status,
            List<String> tools, Map<String, Object> result) {
        static AgentDTO from(Agent agent) {
            return new AgentDTO(
                    agent.getId(), agent.getType(), agent.getGoal(),
                    agent.getStatus(), agent.getTools(), agent.getResult());
        }
    }
}
