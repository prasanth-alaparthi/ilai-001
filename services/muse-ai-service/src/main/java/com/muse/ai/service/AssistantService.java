package com.muse.ai.service;

import com.muse.ai.entity.Conversation;
import com.muse.ai.entity.Message;
import com.muse.ai.entity.UserProfile;
import com.muse.ai.repository.ConversationRepository;
import com.muse.ai.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Assistant Service
 * Handles conversations with context-aware responses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final LLMRouterService llmRouterService;
    private final PersonalizationService personalizationService;

    private static final String SYSTEM_PROMPT = """
            You are ILAI, an intelligent learning assistant. You help students with:
            - Understanding complex topics
            - Organizing their notes and study materials
            - Creating study plans and schedules
            - Generating quizzes and flashcards
            - Answering questions about their coursework

            Be friendly, encouraging, and adapt your explanations to the student's level.
            When appropriate, suggest creating notes, flashcards, or quizzes to reinforce learning.
            """;

    /**
     * Start a new conversation
     */
    @Transactional
    public Conversation startConversation(Long userId, String title, String contextType, String contextId) {
        Conversation conversation = Conversation.builder()
                .userId(userId)
                .title(title != null ? title : "New Conversation")
                .contextType(contextType)
                .contextId(contextId)
                .build();
        return conversationRepository.save(conversation);
    }

    /**
     * Get user's conversations
     */
    public List<Conversation> getUserConversations(Long userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    /**
     * Get conversation by ID
     */
    public Optional<Conversation> getConversation(UUID conversationId) {
        return conversationRepository.findById(conversationId);
    }

    /**
     * Get messages in a conversation
     */
    public List<Message> getMessages(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    /**
     * Send a message and get AI response
     */
    @Transactional
    public Mono<Message> chat(UUID conversationId, Long userId, String userMessage) {
        // Save user message
        Message userMsg = Message.builder()
                .conversationId(conversationId)
                .role("user")
                .content(userMessage)
                .build();
        messageRepository.save(userMsg);

        // Update conversation timestamp
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setUpdatedAt(java.time.Instant.now());
            conversationRepository.save(conv);
        });

        // Get conversation history
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Build context with personalization
        String personalizedPrompt = buildPersonalizedPrompt(userId, userMessage);

        // Convert history to API format
        List<Map<String, Object>> apiHistory = history.stream()
                .map(m -> {
                    String role = m.getRole().equals("assistant") ? "model" : m.getRole();
                    return Map.<String, Object>of(
                            "role", role,
                            "parts", List.of(Map.of("text", m.getContent())));
                })
                .collect(Collectors.toList());

        // Generate response
        return llmRouterService.generateWithHistory(apiHistory, personalizedPrompt)
                .map(response -> {
                    Message assistantMsg = Message.builder()
                            .conversationId(conversationId)
                            .role("assistant")
                            .content(response)
                            .build();
                    return messageRepository.save(assistantMsg);
                })
                .doOnSuccess(msg -> {
                    // Update personalization based on conversation
                    personalizationService.incrementModuleUsage(userId, "assistant");
                })
                .doOnError(error -> {
                    log.error("Error generating response: {}", error.getMessage());
                });
    }

    /**
     * Quick chat without conversation history
     */
    public Mono<String> quickChat(Long userId, String message) {
        String personalizedPrompt = buildPersonalizedPrompt(userId, message);
        return llmRouterService.generateContent(personalizedPrompt, SYSTEM_PROMPT);
    }

    /**
     * Build personalized prompt based on user profile
     */
    private String buildPersonalizedPrompt(Long userId, String message) {
        Optional<UserProfile> profileOpt = personalizationService.getProfile(userId);

        if (profileOpt.isEmpty()) {
            return message;
        }

        UserProfile profile = profileOpt.get();
        StringBuilder context = new StringBuilder();

        // Add learning style context
        if (profile.getLearningStyle() != null) {
            context.append(String.format(
                    "The student prefers %s learning. ",
                    profile.getLearningStyle()));
        }

        // Add recent topics context
        if (profile.getRecentTopics() != null && profile.getRecentTopics().length > 0) {
            context.append(String.format(
                    "They have been studying: %s. ",
                    String.join(", ", Arrays.copyOf(profile.getRecentTopics(),
                            Math.min(5, profile.getRecentTopics().length)))));
        }

        // Add skill level context
        if (!profile.getSkillLevels().isEmpty()) {
            double avgSkill = profile.getSkillLevels().values().stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.5);
            String level = avgSkill < 0.3 ? "beginner" : avgSkill < 0.7 ? "intermediate" : "advanced";
            context.append(String.format("Their overall level is %s. ", level));
        }

        if (context.length() > 0) {
            return String.format("[Context: %s]\n\nUser: %s", context.toString().trim(), message);
        }

        return message;
    }

    /**
     * Delete a conversation
     */
    @Transactional
    public void deleteConversation(UUID conversationId) {
        conversationRepository.deleteById(conversationId);
    }
}
