package com.muse.social;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * ILAI Social Service - Spring Boot 3.5.7 + Java 21
 * 
 * Features:
 * - BountyBoard for academic problem solving
 * - User Reputation & Gamification
 * - Study War Rooms with real-time sync
 * - Stripe integration for tiered billing
 * - Token usage tracking for AI features
 */
@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableJpaAuditing
public class SocialServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SocialServiceApplication.class, args);
    }
}
