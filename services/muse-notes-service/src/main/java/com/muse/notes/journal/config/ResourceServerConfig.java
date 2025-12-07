package com.muse.notes.journal.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
public class ResourceServerConfig {

    private static final Logger logger = LoggerFactory.getLogger(ResourceServerConfig.class);

    @Value("${app.jwt.access-secret}")
    private String jwtSecret;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder))); // Explicitly use the custom decoder

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        logger.info("Configuring JwtDecoder for muse-journal-service.");
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.startsWith("${")) {
            logger.error("FATAL: app.jwt.access-secret is not configured properly in muse-journal-service! It cannot be null, blank, or unresolved.");
            throw new IllegalArgumentException("app.jwt.access-secret is not configured properly.");
        }
        logger.debug("Using secret starting with: '{}'", jwtSecret.substring(0, Math.min(4, jwtSecret.length())));
        SecretKey key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).build();
    }
}
