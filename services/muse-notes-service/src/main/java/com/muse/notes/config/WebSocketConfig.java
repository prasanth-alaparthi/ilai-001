package com.muse.notes.config;

import com.muse.notes.service.NoteSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final NoteSocketHandler noteSocketHandler;
    private final JwtDecoder jwtDecoder;

    public WebSocketConfig(NoteSocketHandler noteSocketHandler, JwtDecoder jwtDecoder) {
        this.noteSocketHandler = noteSocketHandler;
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(noteSocketHandler, "/ws/notes")
                .addInterceptors(new JwtAuthHandshakeInterceptor(jwtDecoder))
                .setAllowedOrigins("*");
    }
}
