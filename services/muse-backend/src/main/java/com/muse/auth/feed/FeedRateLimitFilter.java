package com.muse.auth.feed;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class FeedRateLimitFilter implements Filter {

private static class Bucket {
        int tokens;
        long lastRefillMillis;
    }

private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

private final int capacity = 20;             // max 20 actions
    private final long refillIntervalMs = 60_000; // per 60 seconds

private boolean isRateLimited(String key) {
        long now = Instant.now().toEpochMilli();
        Bucket b = buckets.computeIfAbsent(key, k -> {
            Bucket nb = new Bucket();
            nb.tokens = capacity;
            nb.lastRefillMillis = now;
            return nb;
        });

synchronized (b) {
            long elapsed = now - b.lastRefillMillis;
            if (elapsed > refillIntervalMs) {
                // refill
                int refill = (int) (elapsed / refillIntervalMs) * capacity;
                b.tokens = Math.min(capacity, b.tokens + refill);
                b.lastRefillMillis = now;
            }
            if (b.tokens > 0) {
                b.tokens--;
                return false;
            } else {
                return true;
            }
        }
    }

@Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest http = (HttpServletRequest) req;
        HttpServletResponse resp = (HttpServletResponse) res;

String path = http.getRequestURI();
        String method = http.getMethod();

// limit POST actions on feed endpoints
        if (path.startsWith("/feed") && ("POST".equals(method) || "DELETE".equals(method))) {
            String user = http.getUserPrincipal() != null ? http.getUserPrincipal().getName() : "anon";
            String key = user + ":" + path;
            if (isRateLimited(key)) {
                resp.setStatus(429);
                resp.setContentType("application/json");
                resp.getWriter().write("{\"message\":\"Too many requests. Slow down.\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}