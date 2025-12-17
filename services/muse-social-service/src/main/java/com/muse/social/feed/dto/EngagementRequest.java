package com.muse.social.feed.dto;

import com.muse.social.feed.entity.EngagementEvent;
import lombok.Data;

/**
 * Request to track engagement
 */
@Data
public class EngagementRequest {
    private EngagementEvent.EventType eventType;
    private Integer timeSpentSeconds;
    private Double scrollDepth;
    private String sessionId;
}
