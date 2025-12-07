package com.muse.auth.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodic job to reclaim claimed prekeys older than TTL.
 * TTL and schedule are configurable via application.properties.
 */
@Component
@RequiredArgsConstructor
public class PrekeyReclaimScheduler {

    private final KeyRegistryService keyRegistryService;

    // TTL in seconds for claimed prekeys (default: 300 seconds = 5 minutes)
    @Value("${prekey.claim.ttl:300}")
    private long ttlSeconds;

    // Runs every minute by default; adjust as needed
    @Scheduled(fixedDelayString = "${prekey.reclaim.interval.ms:60000}")
    public void runReclaim() {
        try {
            int reclaimed = keyRegistryService.reclaimStaleClaims(ttlSeconds);
            if (reclaimed > 0) {
                System.out.printf("Reclaimed %d stale claimed prekeys%n", reclaimed);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}