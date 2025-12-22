package com.muse.auth.config;

import com.muse.auth.security.JwtAuthEntryPoint;
import com.muse.auth.security.JwtAuthenticationFilter;
import com.muse.auth.auth.service.CustomUserDetailsService; // Corrected import
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class AuthServiceSecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final CustomUserDetailsService userDetailsService;

    public AuthServiceSecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            JwtAuthEntryPoint jwtAuthEntryPoint,
            CustomUserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtAuthEntryPoint = jwtAuthEntryPoint;
        this.userDetailsService = userDetailsService;
    }

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Bean
    public SecurityFilterChain securityFilterChainAdvanced(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSourceAdvanced()))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(eh -> eh.authenticationEntryPoint(jwtAuthEntryPoint))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints
                        .requestMatchers("/api/auth/login", "/api/auth/authenticate", "/api/auth/register",
                                "/api/auth/refresh", "/api/auth/forgot-password", "/api/auth/reset-password",
                                "/api/auth/verify-email")
                        .permitAll()
                        // OAuth2 login endpoints (disabled but kept for future use)
                        .requestMatchers("/oauth2/**", "/login/oauth2/**", "/api/auth/oauth2/**").permitAll()
                        // Actuator health check for Docker
                        .requestMatchers("/actuator/**").permitAll()
                        // All other API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                // OAuth2 Login disabled - uncomment when GOOGLE_CLIENT_ID is provided
                // .oauth2Login(oauth2 -> oauth2
                // .userInfoEndpoint(userInfo -> userInfo
                // .userService(customOAuth2UserService))
                // .successHandler(oauth2LoginSuccessHandler)
                // .failureHandler(
                // new
                // org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler(
                // frontendBaseUrl + "/login?error=true")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSourceAdvanced() {
        CorsConfiguration config = new CorsConfiguration();
        // Allow both configured frontend URL and production domains
        config.setAllowedOrigins(List.of(
                frontendBaseUrl,
                "https://ilai.co.in",
                "https://www.ilai.co.in",
                "http://localhost:5173",
                "http://localhost:80"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoderAdvanced() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationProvider authenticationProviderAdvanced() {
        DaoAuthenticationProvider dao = new DaoAuthenticationProvider();
        dao.setUserDetailsService(userDetailsService);
        dao.setPasswordEncoder(passwordEncoderAdvanced());
        return dao;
    }

    @Bean
    public AuthenticationManager authenticationManagerAdvanced(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
