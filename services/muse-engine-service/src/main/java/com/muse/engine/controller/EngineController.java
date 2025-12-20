package com.muse.engine.controller;

import com.muse.engine.model.VerifiableArtifact;
import com.muse.engine.service.ArtsHumanitiesClusterService;
import com.muse.engine.service.EarthSocietyClusterService;
import com.muse.engine.service.StemClusterService;
import com.muse.engine.service.SubjectRouter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/engine")
@RequiredArgsConstructor
public class EngineController {

    private final SubjectRouter subjectRouter;
    private final StemClusterService stemService;
    private final EarthSocietyClusterService earthService;
    private final ArtsHumanitiesClusterService artsService;

    @PostMapping("/solve")
    public Mono<VerifiableArtifact> solveProblem(@RequestBody String problem) {
        return subjectRouter.routeProblem(problem)
                .flatMap(cluster -> {
                    switch (cluster) {
                        case "STEM":
                            return stemService.solve(problem);
                        case "EARTH_SOCIETY":
                            return earthService.solve(problem);
                        case "ARTS_HUMANITIES":
                            return artsService.solve(problem);
                        default:
                            return Mono.error(new RuntimeException("Unsupported problem domain: " + cluster));
                    }
                });
    }
}
