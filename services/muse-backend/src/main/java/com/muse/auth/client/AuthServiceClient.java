package com.muse.auth.client;

import com.muse.auth.client.dto.LoginRequest;
import com.muse.auth.client.dto.LoginResponse;
import com.muse.auth.client.dto.MeResponse;
import com.muse.auth.client.dto.RegistrationRequest;
import com.muse.auth.client.dto.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference; // Corrected import
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class AuthServiceClient {

        private final WebClient webClient;

        public AuthServiceClient(@Value("${muse.auth-service.url:http://localhost:8081}") String authServiceBaseUrl) {
                this.webClient = WebClient.builder().baseUrl(authServiceBaseUrl).build();
        }

        public Mono<LoginResponse> login(LoginRequest request) {
                return webClient.post()
                                .uri("/api/auth/login")
                                .bodyValue(request)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono.error(new RuntimeException(
                                                                "Login failed: " + clientResponse.statusCode())))
                                .bodyToMono(LoginResponse.class);
        }

        public Mono<Void> register(RegistrationRequest request) {
                return webClient.post()
                                .uri("/api/auth/register")
                                .bodyValue(request)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono.error(new RuntimeException(
                                                                "Registration failed: " + clientResponse.statusCode())))
                                .bodyToMono(Void.class);
        }

        public Mono<MeResponse> getMe(String accessToken) {
                return webClient.get()
                                .uri("/api/auth/me")
                                .header("Authorization", "Bearer " + accessToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono.error(
                                                                new RuntimeException("Failed to get user details: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(MeResponse.class);
        }

        public Mono<LoginResponse> refresh(String refreshToken) {
                return webClient.post()
                                .uri("/api/auth/refresh")
                                .cookie("REFRESH_TOKEN", refreshToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono
                                                                .error(new RuntimeException("Token refresh failed: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(LoginResponse.class);
        }

        public Mono<Void> logout(String refreshToken) {
                return webClient.post()
                                .uri("/api/auth/logout")
                                .cookie("REFRESH_TOKEN", refreshToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono.error(new RuntimeException(
                                                                "Logout failed: " + clientResponse.statusCode())))
                                .bodyToMono(Void.class);
        }

        public Mono<UserDto> getUserById(Long userId) {
                return webClient.get()
                                .uri("/api/users/{userId}", userId)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono
                                                                .error(new RuntimeException("Failed to get user by ID: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(UserDto.class);
        }

        public Mono<UserDto> getUserByUsername(String username) {
                return getUserByUsername(username, null);
        }

        public Mono<UserDto> getUserByUsername(String username, String accessToken) {
                var request = webClient.get()
                                .uri("/api/users/username/{username}", username);

                if (accessToken != null) {
                        request.header("Authorization", "Bearer " + accessToken);
                }

                return request.retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono.error(
                                                                new RuntimeException("Failed to get user by username: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(UserDto.class);
        }

        // Admin-related calls
        public Mono<List<UserDto>> getPendingUsers(String adminAccessToken) {
                return webClient.get()
                                .uri("/admin/users/pending")
                                .header("Authorization", "Bearer " + adminAccessToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono.error(
                                                                new RuntimeException("Failed to get pending users: "
                                                                                + clientResponse.statusCode())))
                                .bodyToFlux(UserDto.class)
                                .collectList();
        }

        public Mono<UserDto> approveUser(Long userId, String adminAccessToken) {
                return webClient.post()
                                .uri("/admin/users/{userId}/approve", userId)
                                .header("Authorization", "Bearer " + adminAccessToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono
                                                                .error(new RuntimeException("Failed to approve user: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(UserDto.class);
        }

        public Mono<UserDto> blockUser(Long userId, String adminAccessToken) {
                return webClient.post()
                                .uri("/admin/users/{userId}/block", userId)
                                .header("Authorization", "Bearer " + adminAccessToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono
                                                                .error(new RuntimeException("Failed to block user: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(UserDto.class);
        }

        public Mono<Map<String, String>> deleteUser(Long userId, String adminAccessToken) {
                return webClient.post()
                                .uri("/admin/users/{userId}/delete", userId)
                                .header("Authorization", "Bearer " + adminAccessToken)
                                .retrieve()
                                .onStatus(status -> status.is4xxClientError(),
                                                clientResponse -> Mono
                                                                .error(new RuntimeException("Failed to delete user: "
                                                                                + clientResponse.statusCode())))
                                .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {
                                });
        }
}
