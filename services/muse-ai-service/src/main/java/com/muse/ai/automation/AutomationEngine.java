package com.muse.ai.automation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * Automation Engine - Handles event triggers and automated actions
 * Every event in the system can trigger automated responses
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationEngine {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Map<String, List<AutomationRule>> rules = new ConcurrentHashMap<>();

    // ============== Rule Registration ==============

    /**
     * Register an automation rule
     */
    public void registerRule(AutomationRule rule) {
        rules.computeIfAbsent(rule.getTriggerEvent(), k -> new ArrayList<>()).add(rule);
        log.info("Registered automation rule: {} for event: {}", rule.getName(), rule.getTriggerEvent());
    }

    /**
     * Register multiple rules at once
     */
    public void registerRules(List<AutomationRule> ruleList) {
        ruleList.forEach(this::registerRule);
    }

    // ============== Event Processing ==============

    /**
     * Process an incoming event and trigger matching automations
     */
    public void processEvent(String eventType, Map<String, Object> eventData) {
        List<AutomationRule> matchingRules = rules.getOrDefault(eventType, List.of());

        if (matchingRules.isEmpty()) {
            log.debug("No automation rules for event: {}", eventType);
            return;
        }

        log.info("Processing {} automation rules for event: {}", matchingRules.size(), eventType);

        for (AutomationRule rule : matchingRules) {
            try {
                if (rule.conditionsMet(eventData)) {
                    executeRule(rule, eventData);
                }
            } catch (Exception e) {
                log.error("Failed to execute rule {}: {}", rule.getName(), e.getMessage());
            }
        }
    }

    private void executeRule(AutomationRule rule, Map<String, Object> eventData) {
        log.info("Executing automation: {}", rule.getName());

        try {
            rule.getAction().accept(eventData);

            // Publish automation execution event
            Map<String, Object> executionEvent = Map.of(
                    "rule", rule.getName(),
                    "event", rule.getTriggerEvent(),
                    "timestamp", Instant.now().toString(),
                    "success", true);
            redisTemplate.convertAndSend("automation.executed", executionEvent);

        } catch (Exception e) {
            log.error("Automation {} failed: {}", rule.getName(), e.getMessage());
        }
    }

    // ============== Built-in Event Triggers ==============

    /**
     * Get all registered trigger events
     */
    public Set<String> getRegisteredEvents() {
        return rules.keySet();
    }

    /**
     * Get rules for a specific event
     */
    public List<AutomationRule> getRulesForEvent(String eventType) {
        return rules.getOrDefault(eventType, List.of());
    }

    /**
     * Remove a rule by name
     */
    public boolean removeRule(String ruleName) {
        for (List<AutomationRule> ruleList : rules.values()) {
            if (ruleList.removeIf(r -> r.getName().equals(ruleName))) {
                log.info("Removed automation rule: {}", ruleName);
                return true;
            }
        }
        return false;
    }

    /**
     * Disable/enable a rule
     */
    public void setRuleEnabled(String ruleName, boolean enabled) {
        for (List<AutomationRule> ruleList : rules.values()) {
            for (AutomationRule rule : ruleList) {
                if (rule.getName().equals(ruleName)) {
                    rule.setEnabled(enabled);
                    log.info("Rule {} is now {}", ruleName, enabled ? "enabled" : "disabled");
                    return;
                }
            }
        }
    }

    // ============== Automation Rule Definition ==============

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class AutomationRule {
        private String name;
        private String description;
        private String triggerEvent;
        private Map<String, Object> conditions;
        private Consumer<Map<String, Object>> action;
        @lombok.Builder.Default
        private boolean enabled = true;
        private Long userId; // null means system-wide, otherwise user-specific

        public boolean conditionsMet(Map<String, Object> eventData) {
            if (!enabled)
                return false;
            if (conditions == null || conditions.isEmpty())
                return true;

            // Check each condition
            for (Map.Entry<String, Object> condition : conditions.entrySet()) {
                Object eventValue = eventData.get(condition.getKey());
                if (!Objects.equals(eventValue, condition.getValue())) {
                    return false;
                }
            }
            return true;
        }
    }
}
