package com.muse.auth.chat;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final MessageWebSocketHandler messageWebSocketHandler;
    private final AuthenticatedMessageWebSocketHandler authenticatedMessageWebSocketHandler;

    public WebSocketConfig(MessageWebSocketHandler messageWebSocketHandler,
                           AuthenticatedMessageWebSocketHandler authenticatedMessageWebSocketHandler) {
        this.messageWebSocketHandler = messageWebSocketHandler;
        this.authenticatedMessageWebSocketHandler = authenticatedMessageWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Allow all origins in dev; lock this down in production.
        registry.addHandler(messageWebSocketHandler, "/ws/messages").setAllowedOrigins("*");
        registry.addHandler(authenticatedMessageWebSocketHandler, "/ws/messages_auth").setAllowedOrigins("*");
    }
}
