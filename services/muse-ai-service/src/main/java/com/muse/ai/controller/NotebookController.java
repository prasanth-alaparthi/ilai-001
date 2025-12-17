package com.muse.ai.controller;

import com.muse.ai.service.*;
import com.muse.ai.service.AudioOverviewService.*;
import com.muse.ai.service.MindMapService.*;
import com.muse.ai.service.SourceGroundingService.*;
import com.muse.ai.service.StudyGuideService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * NotebookLM Controller - Phase 5 API
 * Exposes NotebookLM-style features: study guides, mind maps, audio overviews
 */
@RestController
@RequestMapping("/api/notebook")
@RequiredArgsConstructor
@Slf4j
public class NotebookController {

    private final StudyGuideService studyGuideService;
    private final MindMapService mindMapService;
    private final AudioOverviewService audioService;
    private final SourceGroundingService groundingService;

    // ============== Study Guides ==============

    /**
     * Generate comprehensive study guide
     * POST /api/notebook/study-guide
     */
    @PostMapping("/study-guide")
    public Mono<ResponseEntity<StudyGuide>> generateStudyGuide(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody StudyGuideRequest request) {
        return studyGuideService.generateStudyGuide(userId, request.topic(), request.noteIds())
                .map(ResponseEntity::ok);
    }

    /**
     * Extract key concepts from content
     * POST /api/notebook/key-concepts
     */
    @PostMapping("/key-concepts")
    public Mono<ResponseEntity<List<KeyConcept>>> extractKeyConcepts(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody ContentRequest request) {
        return studyGuideService.extractKeyConcepts(userId, request.content())
                .map(ResponseEntity::ok);
    }

    /**
     * Generate FAQ from content
     * POST /api/notebook/faq
     */
    @PostMapping("/faq")
    public Mono<ResponseEntity<List<FAQ>>> generateFAQ(
            @RequestBody FAQRequest request) {
        return studyGuideService.generateFAQ(request.content(), request.count())
                .map(ResponseEntity::ok);
    }

    /**
     * Generate briefing document
     * POST /api/notebook/briefing
     */
    @PostMapping("/briefing")
    public Mono<ResponseEntity<BriefingDocument>> generateBriefing(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody BriefingRequest request) {
        return studyGuideService.generateBriefing(userId, request.title(), request.noteIds())
                .map(ResponseEntity::ok);
    }

    /**
     * Generate timeline from content
     * POST /api/notebook/timeline
     */
    @PostMapping("/timeline")
    public Mono<ResponseEntity<List<TimelineEvent>>> generateTimeline(
            @RequestBody ContentRequest request) {
        return studyGuideService.generateTimeline(request.content())
                .map(ResponseEntity::ok);
    }

    // ============== Mind Maps ==============

    /**
     * Generate mind map
     * POST /api/notebook/mind-map
     */
    @PostMapping("/mind-map")
    public Mono<ResponseEntity<MindMap>> generateMindMap(
            @RequestBody MindMapRequest request) {
        return mindMapService.generateMindMap(request.content(), request.centralTopic())
                .map(ResponseEntity::ok);
    }

    /**
     * Generate concept graph
     * POST /api/notebook/concept-graph
     */
    @PostMapping("/concept-graph")
    public Mono<ResponseEntity<ConceptGraph>> generateConceptGraph(
            @RequestBody ContentRequest request) {
        return mindMapService.generateConceptGraph(request.content())
                .map(ResponseEntity::ok);
    }

    /**
     * Expand mind map node
     * POST /api/notebook/mind-map/expand
     */
    @PostMapping("/mind-map/expand")
    public Mono<ResponseEntity<List<MindMapNode>>> expandNode(
            @RequestBody ExpandNodeRequest request) {
        return mindMapService.expandNode(request.nodeName(), request.context())
                .map(ResponseEntity::ok);
    }

    // ============== Audio Overview ==============

    /**
     * Generate podcast-style script
     * POST /api/notebook/podcast-script
     */
    @PostMapping("/podcast-script")
    public Mono<ResponseEntity<PodcastScript>> generatePodcastScript(
            @RequestBody PodcastRequest request) {
        return audioService.generatePodcastScript(request.content(), request.topic())
                .map(ResponseEntity::ok);
    }

    /**
     * Generate summary audio script
     * POST /api/notebook/audio-script
     */
    @PostMapping("/audio-script")
    public Mono<ResponseEntity<AudioScript>> generateAudioScript(
            @RequestBody ContentRequest request) {
        return audioService.generateSummaryScript(request.content())
                .map(ResponseEntity::ok);
    }

    /**
     * Generate audio from script
     * POST /api/notebook/audio
     */
    @PostMapping("/audio")
    public Mono<ResponseEntity<AudioResult>> generateAudio(
            @RequestBody AudioGenerationRequest request) {
        return audioService.generateAudio(request.script(), request.voice())
                .map(ResponseEntity::ok);
    }

    /**
     * Get available voices
     * GET /api/notebook/voices
     */
    @GetMapping("/voices")
    public ResponseEntity<List<VoiceOption>> getVoices() {
        return ResponseEntity.ok(audioService.getAvailableVoices());
    }

    // ============== Source Grounding ==============

    /**
     * Generate grounded response with citations
     * POST /api/notebook/grounded
     */
    @PostMapping("/grounded")
    public Mono<ResponseEntity<GroundedResponse>> generateGroundedResponse(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody QueryRequest request) {
        return groundingService.generateGroundedResponse(request.query(), userId)
                .map(ResponseEntity::ok);
    }

    // ============== Request Records ==============

    record StudyGuideRequest(String topic, List<String> noteIds) {
    }

    record ContentRequest(String content) {
    }

    record FAQRequest(String content, int count) {
    }

    record BriefingRequest(String title, List<String> noteIds) {
    }

    record MindMapRequest(String content, String centralTopic) {
    }

    record ExpandNodeRequest(String nodeName, String context) {
    }

    record PodcastRequest(String content, String topic) {
    }

    record AudioGenerationRequest(String script, String voice) {
    }

    record QueryRequest(String query) {
    }
}
