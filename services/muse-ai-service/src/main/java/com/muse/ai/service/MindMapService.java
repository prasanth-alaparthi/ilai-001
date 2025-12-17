package com.muse.ai.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Mind Map Service - Phase 5
 * Generates interactive mind maps from notes (like NotebookLM)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MindMapService {

    private final LLMRouterService llmRouterService;

    /**
     * Generate mind map data from content
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "mindMapFallback")
    public Mono<MindMap> generateMindMap(String content, String centralTopic) {
        String prompt = """
                Create a hierarchical mind map for: %s

                Based on this content:
                %s

                Format the mind map as follows:
                CENTRAL: [main topic]

                BRANCH: [branch name]
                - Node: [concept]
                  - SubNode: [detail]
                  - SubNode: [detail]
                - Node: [concept]

                BRANCH: [another branch]
                - Node: [concept]

                Include 4-6 main branches with 2-4 nodes each.
                Make connections between related concepts with:
                CONNECTION: [node1] -> [node2]: [relationship]
                """.formatted(centralTopic, content);

        return llmRouterService.generateContent(prompt, "mind_map")
                .map(response -> parseMindMap(response, centralTopic));
    }

    /**
     * Generate a concept graph for knowledge visualization
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "conceptGraphFallback")
    public Mono<ConceptGraph> generateConceptGraph(String content) {
        String prompt = """
                Extract concepts and relationships from this content:

                %s

                Format as:
                CONCEPT: [name] | [type: person/event/term/process] | [importance: 1-10]

                RELATIONSHIP: [concept1] | [relationship type] | [concept2]

                Relationship types: causes, enables, contradicts, extends, includes, requires
                """.formatted(content);

        return llmRouterService.generateContent(prompt, "concept_graph")
                .map(this::parseConceptGraph);
    }

    /**
     * Expand a node in the mind map
     */
    @CircuitBreaker(name = "llm", fallbackMethod = "expandNodeFallback")
    public Mono<List<MindMapNode>> expandNode(String nodeName, String context) {
        String prompt = """
                Expand on the concept: %s

                Context: %s

                Provide 3-5 sub-concepts or details as:
                - SubNode: [concept] | [brief explanation]
                """.formatted(nodeName, context);

        return llmRouterService.generateContent(prompt, "expand_node")
                .map(this::parseExpandedNodes);
    }

    // ============== Parsing Methods ==============

    private MindMap parseMindMap(String response, String centralTopic) {
        MindMapNode central = new MindMapNode("central", centralTopic, "central", new ArrayList<>());
        List<MindMapNode> branches = new ArrayList<>();
        List<Connection> connections = new ArrayList<>();

        String currentBranch = null;
        MindMapNode currentNode = null;
        List<MindMapNode> currentChildren = new ArrayList<>();

        for (String line : response.split("\n")) {
            line = line.trim();

            if (line.startsWith("BRANCH:")) {
                // Save previous branch
                if (currentBranch != null) {
                    branches.add(new MindMapNode(
                            "branch-" + branches.size(),
                            currentBranch,
                            "branch",
                            new ArrayList<>(currentChildren)));
                }
                currentBranch = line.substring(7).trim();
                currentChildren = new ArrayList<>();
            } else if (line.startsWith("- Node:")) {
                String nodeName = line.substring(7).trim();
                currentNode = new MindMapNode(
                        "node-" + System.currentTimeMillis() % 10000,
                        nodeName,
                        "node",
                        new ArrayList<>());
                currentChildren.add(currentNode);
            } else if (line.startsWith("- SubNode:") && currentNode != null) {
                String subNodeName = line.substring(10).trim();
                currentNode.children().add(new MindMapNode(
                        "subnode-" + System.currentTimeMillis() % 10000,
                        subNodeName,
                        "subnode",
                        new ArrayList<>()));
            } else if (line.startsWith("CONNECTION:")) {
                Pattern p = Pattern.compile("CONNECTION:\\s*(.+?)\\s*->\\s*(.+?):\\s*(.+)");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    connections.add(new Connection(m.group(1), m.group(2), m.group(3)));
                }
            }
        }

        // Add last branch
        if (currentBranch != null) {
            branches.add(new MindMapNode(
                    "branch-" + branches.size(),
                    currentBranch,
                    "branch",
                    currentChildren));
        }

        central.children().addAll(branches);
        return new MindMap(central, connections);
    }

    private ConceptGraph parseConceptGraph(String response) {
        List<Concept> concepts = new ArrayList<>();
        List<Relationship> relationships = new ArrayList<>();

        for (String line : response.split("\n")) {
            line = line.trim();

            if (line.startsWith("CONCEPT:")) {
                String[] parts = line.substring(8).split("\\|");
                if (parts.length >= 3) {
                    concepts.add(new Concept(
                            parts[0].trim(),
                            parts[1].trim(),
                            Integer.parseInt(parts[2].trim())));
                }
            } else if (line.startsWith("RELATIONSHIP:")) {
                String[] parts = line.substring(13).split("\\|");
                if (parts.length >= 3) {
                    relationships.add(new Relationship(
                            parts[0].trim(),
                            parts[1].trim(),
                            parts[2].trim()));
                }
            }
        }

        return new ConceptGraph(concepts, relationships);
    }

    private List<MindMapNode> parseExpandedNodes(String response) {
        List<MindMapNode> nodes = new ArrayList<>();

        for (String line : response.split("\n")) {
            if (line.trim().startsWith("- SubNode:")) {
                String content = line.substring(line.indexOf(":") + 1).trim();
                String name = content.split("\\|")[0].trim();
                nodes.add(new MindMapNode(
                        "expanded-" + nodes.size(),
                        name,
                        "expanded",
                        new ArrayList<>()));
            }
        }

        return nodes;
    }

    // ============== Fallback Methods ==============

    private Mono<MindMap> mindMapFallback(String content, String centralTopic, Throwable t) {
        log.warn("Mind map fallback: {}", t.getMessage());
        MindMapNode central = new MindMapNode("central", centralTopic, "central", new ArrayList<>());
        return Mono.just(new MindMap(central, new ArrayList<>()));
    }

    private Mono<ConceptGraph> conceptGraphFallback(String content, Throwable t) {
        log.warn("Concept graph fallback: {}", t.getMessage());
        return Mono.just(new ConceptGraph(new ArrayList<>(), new ArrayList<>()));
    }

    private Mono<List<MindMapNode>> expandNodeFallback(String nodeName, String context, Throwable t) {
        log.warn("Expand node fallback: {}", t.getMessage());
        return Mono.just(Collections.emptyList());
    }

    // ============== Records ==============

    public record MindMap(MindMapNode central, List<Connection> connections) {
    }

    public record MindMapNode(String id, String label, String type, List<MindMapNode> children) {
    }

    public record Connection(String from, String to, String relationship) {
    }

    public record ConceptGraph(List<Concept> concepts, List<Relationship> relationships) {
    }

    public record Concept(String name, String type, int importance) {
    }

    public record Relationship(String source, String type, String target) {
    }
}
