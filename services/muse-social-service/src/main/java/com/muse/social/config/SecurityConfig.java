package com.muse.social.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration for muse-social-service.
 * Uses shared JWT secret with muse-auth-service.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final com.muse.social.security.JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    @Order(3) // Order 3: After static resources (1) and API security (2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Only match social/chat specific paths that aren't handled by
                // ResourceServerConfig
                .securityMatcher("/api/bounties/**", "/api/social/**", "/api/reputation/**",
                        "/api/features/**", "/api/groups/**", "/api/chat/**")
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/api/webhooks/stripe").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bounties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/public/**").permitAll()
                        .requestMatchers("/ws/**").permitAll() // WebSocket handshake

                        // Protected endpoints
                        .requestMatchers("/api/bounties/**").authenticated()
                        .requestMatchers("/api/social/**").authenticated()
                        .requestMatchers("/api/reputation/**").authenticated()
                        .requestMatchers("/api/features/**").authenticated()
                        .requestMatchers("/api/groups/**").authenticated()
                        .requestMatchers("/api/chat/**").authenticated()

                        // Default: require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://ilai.co.in",
                "https://www.ilai.co.in"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
