package com.muse.social.feed.client;

import com.muse.social.feed.dto.UserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@Slf4j
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
                    log.warn("Error fetching user {}: {}", userId, e.getMessage());
                    return Mono.empty();
                });
    }
}
