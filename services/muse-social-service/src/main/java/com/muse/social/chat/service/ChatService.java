package com.muse.social.chat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.muse.social.chat.model.Conversation;
import com.muse.social.chat.model.ConversationParticipant;
import com.muse.social.chat.model.Message;
import com.muse.social.chat.repository.ConversationParticipantRepository;
import com.muse.social.chat.repository.ConversationRepository;
import com.muse.social.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${gemini.api.key}")
    private String groqApiKey;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.groq.com/openai/v1")
            .build();

    @Transactional
    public Conversation createConversation(String userId, Conversation.ConversationType type, String name,
            List<String> participantIds, Conversation.ContextType contextType, String contextId) {
        Conversation conversation = Conversation.builder()
                .type(type)
                .name(name)
                .contextType(contextType != null ? contextType : Conversation.ContextType.GENERAL)
                .contextId(contextId)
                .build();
        conversation = conversationRepository.save(conversation);

        // Add creator
        participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .userId(userId)
                .role(ConversationParticipant.Role.ADMIN)
                .build());

        // Add other participants
        if (participantIds != null) {
            for (String pid : participantIds) {
                if (!pid.equals(userId)) {
                    participantRepository.save(ConversationParticipant.builder()
                            .conversation(conversation)
                            .userId(pid)
                            .role(ConversationParticipant.Role.MEMBER)
                            .build());
                }
            }
        }
        return conversation;
    }

    public List<com.muse.social.chat.model.ConversationDTO> getUserConversations(String userId) {
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        return conversations.stream().map(this::toDTO).collect(java.util.stream.Collectors.toList());
    }

    public List<com.muse.social.chat.model.ConversationDTO> getConversationsByContext(Conversation.ContextType type,
            String contextId) {
        return conversationRepository.findByContextTypeAndContextId(type, contextId).stream()
                .map(this::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public com.muse.social.chat.model.ConversationDTO toDTO(Conversation c) {
        List<String> pIds = participantRepository.findByConversationId(c.getId()).stream()
                .map(ConversationParticipant::getUserId)
                .collect(java.util.stream.Collectors.toList());

        return com.muse.social.chat.model.ConversationDTO.builder()
                .id(c.getId())
                .type(c.getType())
                .name(c.getName())
                .contextType(c.getContextType())
                .contextId(c.getContextId())
                .createdAt(c.getCreatedAt())
                .participantIds(pIds)
                .build();
    }

    public Page<Message> getMessages(UUID conversationId, Pageable pageable) {
        return messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
    }

    @Transactional
    public Message sendMessage(String userId, UUID conversationId, String content, Message.MessageType type,
            String mediaUrl, UUID replyToId) {
        // Verify user is participant
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new IllegalArgumentException("User is not a participant of this conversation");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(userId)
                .content(content)
                .type(type)
                .mediaUrl(mediaUrl)
                .replyToId(replyToId)
                .status(Message.MessageStatus.SENT)
                .build();
        message = messageRepository.save(message);
        log.info("Message saved - ID: {}, Conversation: {}, Sender: {}", message.getId(), conversationId, userId);

        // Update conversation last message
        conversation.setLastMessageId(message.getId());
        conversationRepository.save(conversation);

        // Notify subscribers via WebSocket (use DTO to avoid lazy loading issues)
        String topic = "/topic/conversation/" + conversationId;
        MessageDTO dto = MessageDTO.fromEntity(message);
        messagingTemplate.convertAndSend(topic, dto);
        log.info("Message broadcasted to topic: {} - Message ID: {}", topic, message.getId());

        // If it's an AI chat, trigger AI response
        if (conversation.getType() == Conversation.ConversationType.AI) {
            handleAiResponse(conversation, content);
        }

        return message;
    }

    private void handleAiResponse(Conversation conversation, String userPrompt) {
        callGroq(userPrompt).subscribe(aiResponse -> {
            Message aiMessage = Message.builder()
                    .conversation(conversation)
                    .senderId("AI_BOT")
                    .content(aiResponse)
                    .type(Message.MessageType.AI_RESPONSE)
                    .build();
            aiMessage = messageRepository.save(aiMessage);
            MessageDTO dto = MessageDTO.fromEntity(aiMessage);
            messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), dto);
        });
    }

    private Mono<String> callGroq(String prompt) {
        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> req = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(message));

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + groqApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(resp -> resp.path("choices").get(0).path("message").path("content").asText())
                .onErrorReturn("I'm having trouble thinking right now.")
                .timeout(Duration.ofSeconds(60));
    }
}
