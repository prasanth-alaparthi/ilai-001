package com.muse.academic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class ResourceServerConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public ResourceServerConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Actuator endpoints are public
                        .requestMatchers("/actuator/**").permitAll()
                        // Allow CORS preflight requests
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // GET /api/clubs endpoints are public
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/clubs").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/clubs/**").permitAll()
                        // POST, PUT, DELETE on /api/clubs require authentication
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/clubs").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/clubs/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/clubs/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/clubs/**").authenticated()
                        // All other requests require authentication
                        .anyRequest().authenticated())
                // Handle authentication errors with detailed logging
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            // Log auth errors for debugging (use proper logging in production)
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"" + authException.getMessage() + "\"}");
                        }))
                // Disable anonymous authentication - we handle this ourselves
                .anonymous(anon -> anon.disable())
                // Add our custom JWT filter AFTER BasicAuthenticationFilter
                .addFilterAfter(jwtAuthenticationFilter,
                        org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow both localhost and production domains
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:80",
                "https://ilai.co.in",
                "https://www.ilai.co.in"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
