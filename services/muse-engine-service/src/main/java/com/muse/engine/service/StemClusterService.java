package com.muse.engine.service;

import com.muse.engine.model.VerifiableArtifact;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StemClusterService {
    private final WebClient.Builder webClientBuilder;

    @Value("${compute.engine.url:http://muse-compute-engine:8000}")
    private String computeEngineUrl;

    public Mono<VerifiableArtifact> solve(String problem) {
        return webClientBuilder.build()
                .post()
                .uri(computeEngineUrl + "/api/compute/solve")
                .bodyValue(Map.of("problem", problem, "cluster", "STEM"))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    if (Boolean.TRUE.equals(response.get("success"))) {
                        return VerifiableArtifact.builder()
                                .subject((String) response.getOrDefault("subject", "STEM"))
                                .cluster("STEM")
                                .derivationLatex((String) response.get("derivation_latex"))
                                .evidence(VerifiableArtifact.Evidence.builder()
                                        .type("CODE_LOGS")
                                        .content((String) response.get("evidence"))
                                        .build())
                                .assumptions((List<VerifiableArtifact.Assumption>) response.get("assumptions"))
                                .build();
                    }
                    throw new RuntimeException("Compute failed: " + response.get("error"));
                });
    }
}
