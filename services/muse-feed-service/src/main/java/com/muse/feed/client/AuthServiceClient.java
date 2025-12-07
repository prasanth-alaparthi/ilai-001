package com.muse.feed.client;

import com.muse.feed.dto.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class AuthServiceClient {

    private final WebClient webClient;

    public AuthServiceClient(WebClient.Builder webClientBuilder,
            @Value("${muse.auth-service.url:http://muse-auth-service:8081}") String authServiceUrl) {
        this.webClient = webClientBuilder.baseUrl(authServiceUrl).build();
    }

    public Mono<UserDto> getUserById(Long userId) {
        return webClient.get()
                .uri("/api/users/{userId}", userId)
                .retrieve()
                .bodyToMono(UserDto.class)
                .onErrorResume(e -> {
                    // Log error or return empty
                    System.err.println("Error fetching user " + userId + ": " + e.getMessage());
                    return Mono.empty();
                });
    }
}
