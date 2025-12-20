package com.muse.engine.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubjectRouter {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai.service.url:http://muse-ai-service:8088}")
    private String aiServiceUrl;

    public Mono<String> routeProblem(String problem) {
        log.info("Analyzing problem for routing: {}", problem);

        String prompt = String.format("""
                Analyze this problem and route it to exactly one of: STEM, EARTH_SOCIETY, ARTS_HUMANITIES.
                Return ONLY the cluster name.

                Problem: %s
                """, problem);

        return webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/api/ai/generate")
                .bodyValue(Map.of("prompt", prompt, "systemInstruction", "You are a professional research router."))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    String result = (String) response.get("result");
                    if (result == null)
                        return "STEM"; // Fallback
                    String cluster = result.trim().toUpperCase();
                    if (cluster.contains("STEM"))
                        return "STEM";
                    if (cluster.contains("EARTH"))
                        return "EARTH_SOCIETY";
                    if (cluster.contains("ARTS"))
                        return "ARTS_HUMANITIES";
                    return "STEM"; // Default
                })
                .onErrorReturn("STEM");
    }
}
