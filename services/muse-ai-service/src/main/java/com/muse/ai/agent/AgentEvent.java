package com.muse.ai.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Agent Event - Represents a streaming event from agent execution
 * Used for SSE (Server-Sent Events) to provide real-time feedback
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AgentEvent {

    /**
     * Event types for agent execution stages
     */
    public enum EventType {
        STARTED, // Agent execution started
        THINKING, // Agent is analyzing/planning
        TOOL_CALL, // Agent is calling a tool
        TOOL_RESULT, // Tool returned a result
        PROGRESS, // Progress update (percentage)
        STREAMING, // Streaming LLM response
        COMPLETE, // Agent finished successfully
        ERROR // Agent encountered an error
    }

    private EventType type;
    private String message;
    private int progress; // 0-100
    private String toolName; // For TOOL_CALL events
    private Map<String, Object> data;
    private Instant timestamp;

    // Factory methods for common events

    public static AgentEvent started(String message) {
        return AgentEvent.builder()
                .type(EventType.STARTED)
                .message(message)
                .progress(0)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent thinking(String message) {
        return AgentEvent.builder()
                .type(EventType.THINKING)
                .message(message)
                .progress(10)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent toolCall(String toolName, String message) {
        return AgentEvent.builder()
                .type(EventType.TOOL_CALL)
                .toolName(toolName)
                .message(message)
                .progress(30)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent toolResult(String toolName, Map<String, Object> result) {
        return AgentEvent.builder()
                .type(EventType.TOOL_RESULT)
                .toolName(toolName)
                .message("Tool " + toolName + " completed")
                .data(result)
                .progress(50)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent progress(int progress, String message) {
        return AgentEvent.builder()
                .type(EventType.PROGRESS)
                .message(message)
                .progress(progress)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent streaming(String chunk) {
        return AgentEvent.builder()
                .type(EventType.STREAMING)
                .message(chunk)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent complete(String message, Map<String, Object> result) {
        return AgentEvent.builder()
                .type(EventType.COMPLETE)
                .message(message)
                .data(result)
                .progress(100)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent error(String message) {
        return AgentEvent.builder()
                .type(EventType.ERROR)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }
}
