package com.muse.academic.academic.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class SmartClassController {

    @MessageMapping("/smart-class/{classroomId}/toggle")
    @SendTo("/topic/smart-class/{classroomId}")
    public ProjectorState toggleProjector(@DestinationVariable Long classroomId, ProjectorState state) {
        // In a real app, we might save this state to the DB
        return state;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectorState {
        private boolean active;
        private String contentUrl; // Optional: URL of content being projected
        private String message;
    }
}
