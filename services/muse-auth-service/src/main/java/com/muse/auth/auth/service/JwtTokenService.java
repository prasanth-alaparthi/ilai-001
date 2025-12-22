package com.muse.auth.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
@Slf4j
public class JwtTokenService {

    private final SecretKey accessSecret;
    private final SecretKey refreshSecret;

    @Value("${app.jwt.access-ttl-seconds:3600}")
    private long accessTtlSeconds;

    @Value("${app.jwt.refresh-ttl-seconds:604800}")
    private long refreshTtlSeconds;

    @Value("${app.jwt.issuer-uri}")
    private String issuerUri;

    public JwtTokenService(
            @Value("${app.jwt.access-secret}") String accessSecretString,
            @Value("${app.jwt.refresh-secret}") String refreshSecretString) {
        // Try to base64 decode, fall back to UTF-8 bytes if not base64
        byte[] accessKeyBytes = tryBase64Decode(accessSecretString);
        byte[] refreshKeyBytes = tryBase64Decode(refreshSecretString);
        this.accessSecret = Keys.hmacShaKeyFor(accessKeyBytes);
        this.refreshSecret = Keys.hmacShaKeyFor(refreshKeyBytes);
    }

    private byte[] tryBase64Decode(String secret) {
        // Trim whitespace (including newlines from .env files)
        String trimmedSecret = secret.trim();
        try {
            return java.util.Base64.getDecoder().decode(trimmedSecret);
        } catch (IllegalArgumentException e) {
            // Not base64, use UTF-8 bytes directly
            return trimmedSecret.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String generateAccessToken(String subject, Map<String, Object> claims) {
        return generateToken(subject, claims, accessTtlSeconds, accessSecret, false);
    }

    public String generateRefreshToken(String subject, Map<String, Object> claims) {
        return generateToken(subject, claims, refreshTtlSeconds, refreshSecret, true);
    }

    public Jws<Claims> parseAccessToken(String token) {
        return parseToken(token, accessSecret);
    }

    public Jws<Claims> parseRefreshToken(String token) {
        return parseToken(token, refreshSecret);
    }

    private String generateToken(String subject, Map<String, Object> claims, long ttlSeconds, SecretKey secret,
            boolean isRefreshToken) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuer(issuerUri)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(secret, SignatureAlgorithm.HS256);

        if (isRefreshToken) {
            builder.setId(UUID.randomUUID().toString()); // Add JTI for uniqueness
        }

        return builder.compact();
    }

    private Jws<Claims> parseToken(String token, SecretKey secret) {
        return Jwts.parserBuilder()
                .setSigningKey(secret)
                .build()
                .parseClaimsJws(token);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(accessSecret).build().parseClaimsJws(token).getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public long getAccessTtlSeconds() {
        return accessTtlSeconds;
    }

    public long getRefreshTtlSeconds() {
        return refreshTtlSeconds;
    }
}
