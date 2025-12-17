package com.muse.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.muse.ai.event.EventListener;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new Jackson2JsonRedisSerializer<>(Object.class));
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new Jackson2JsonRedisSerializer<>(Object.class));
        return template;
    }

    // Event channels
    @Bean
    public ChannelTopic notesEventsTopic() {
        return new ChannelTopic("events:notes");
    }

    @Bean
    public ChannelTopic feedEventsTopic() {
        return new ChannelTopic("events:feed");
    }

    @Bean
    public ChannelTopic classroomEventsTopic() {
        return new ChannelTopic("events:classroom");
    }

    @Bean
    public ChannelTopic userEventsTopic() {
        return new ChannelTopic("events:user");
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            MessageListenerAdapter notesListener,
            MessageListenerAdapter feedListener,
            MessageListenerAdapter classroomListener,
            MessageListenerAdapter userListener) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(notesListener, notesEventsTopic());
        container.addMessageListener(feedListener, feedEventsTopic());
        container.addMessageListener(classroomListener, classroomEventsTopic());
        container.addMessageListener(userListener, userEventsTopic());
        return container;
    }

    @Bean
    public MessageListenerAdapter notesListener(EventListener eventListener) {
        return new MessageListenerAdapter(eventListener, "handleNotesEvent");
    }

    @Bean
    public MessageListenerAdapter feedListener(EventListener eventListener) {
        return new MessageListenerAdapter(eventListener, "handleFeedEvent");
    }

    @Bean
    public MessageListenerAdapter classroomListener(EventListener eventListener) {
        return new MessageListenerAdapter(eventListener, "handleClassroomEvent");
    }

    @Bean
    public MessageListenerAdapter userListener(EventListener eventListener) {
        return new MessageListenerAdapter(eventListener, "handleUserEvent");
    }
}
