package com.muse.academic.parental.client;

import com.muse.academic.parental.client.dto.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class AuthServiceClient {

    private final WebClient webClient;

    public AuthServiceClient(@Value("${muse.auth-service.url:http://localhost:8081}") String authServiceBaseUrl) {
        this.webClient = WebClient.builder().baseUrl(authServiceBaseUrl).build();
    }

    public Mono<UserDto> getUserByUsername(String username) {
        return webClient.get()
                .uri("/api/users/username/{username}", username)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(),
                        clientResponse -> Mono.error(
                                new RuntimeException("Failed to get user by username: " + clientResponse.statusCode())))
                .bodyToMono(UserDto.class);
    }
}
