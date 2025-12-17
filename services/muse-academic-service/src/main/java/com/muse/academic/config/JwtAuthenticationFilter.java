package com.muse.academic.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Custom JWT authentication filter that uses the same JJWT library as
 * auth-service
 * to ensure consistent token parsing.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final SecretKey accessSecret;

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String jwtSecret) {
        this.accessSecret = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        log.debug("JwtAuthenticationFilter initialized with secret length: {}", jwtSecret.length());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        log.trace("Processing request: {} {}", request.getMethod(), request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("ACCESS_TOKEN".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null) {
            try {
                Jws<Claims> claimsJws = Jwts.parserBuilder()
                        .setSigningKey(accessSecret)
                        .build()
                        .parseClaimsJws(token);

                Claims claims = claimsJws.getBody();
                String subject = claims.getSubject();
                String role = claims.get("role", String.class);

                log.debug("JWT authenticated for subject: {}, role: {}", subject, role);

                // Convert JJWT Claims to Spring Security Jwt
                Map<String, Object> claimsMap = new HashMap<>(claims);
                Instant issuedAt = claims.getIssuedAt() != null ? claims.getIssuedAt().toInstant() : Instant.now();
                Instant expiresAt = claims.getExpiration() != null ? claims.getExpiration().toInstant()
                        : Instant.now().plusSeconds(3600);

                Jwt springJwt = new Jwt(token, issuedAt, expiresAt,
                        Map.of("alg", "HS256", "typ", "JWT"), claimsMap);

                List<SimpleGrantedAuthority> authorities = role != null
                        ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                        : Collections.emptyList();

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(springJwt,
                        null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                log.debug("JWT expired at: {}", e.getClaims().getExpiration());
            } catch (io.jsonwebtoken.security.SignatureException e) {
                log.warn("Invalid JWT signature");
            } catch (io.jsonwebtoken.MalformedJwtException e) {
                log.warn("Malformed JWT token");
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
