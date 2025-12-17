package com.muse.social.feed.config;

import com.muse.social.feed.service.FeedWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final FeedWebSocketHandler feedWebSocketHandler;
    private final JwtDecoder jwtDecoder;

    public WebSocketConfig(FeedWebSocketHandler feedWebSocketHandler, JwtDecoder jwtDecoder) {
        this.feedWebSocketHandler = feedWebSocketHandler;
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(feedWebSocketHandler, "/ws/feed")
                .addInterceptors(new JwtAuthHandshakeInterceptor(jwtDecoder))
                .setAllowedOrigins("*");
    }
}
