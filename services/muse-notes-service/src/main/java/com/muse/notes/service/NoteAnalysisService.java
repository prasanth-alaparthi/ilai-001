package com.muse.notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.muse.notes.entity.Note;
import com.muse.notes.entity.NoteLink;
import com.muse.notes.entity.NoteSuggestion;
import com.muse.notes.repository.NoteLinkRepository;
import com.muse.notes.repository.NoteRepository;
import com.muse.notes.repository.NoteSuggestionRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class NoteAnalysisService {

    private final NoteRepository repo;
    private final NoteLinkRepository linkRepo;
    private final NoteSuggestionRepository suggestionRepo;
    private final EmbeddingService embeddingService;

    public NoteAnalysisService(NoteRepository repo,
            NoteLinkRepository linkRepo,
            NoteSuggestionRepository suggestionRepo,
            EmbeddingService embeddingService) {
        this.repo = repo;
        this.linkRepo = linkRepo;
        this.suggestionRepo = suggestionRepo;
        this.embeddingService = embeddingService;
    }

    @Async
    @Transactional
    public void analyzeNoteContentAsync(Long noteId) {
        // Fetch the note fresh to avoid detached entity issues
        repo.findById(noteId).ifPresent(note -> {

            // Clear previous suggestions for this note
            suggestionRepo.deleteByNoteId(note.getId());

            String textContent = extractTextFromNode(note.getContent());

            // Example 1: Generate embeddings and suggest links
            embeddingService.getEmbedding(textContent).subscribe(embedding -> {
                // Save embedding to note
                note.setEmbedding(embedding);
                repo.save(note);

                // Generate Suggestions (Similar notes not yet linked)
                generateSuggestions(note, embedding);
            });

            // Example 2: Simple keyword-based suggestion (e.g., for tasks)
            if (textContent.contains("TODO")) {
                suggestionRepo.save(NoteSuggestion.builder()
                        .note(note)
                        .type("TASK_REMINDER")
                        .suggestionContent("Found 'TODO' in your note. Consider adding a task.")
                        .build());
            }
        });
    }

    private void generateSuggestions(Note note, float[] embedding) {
        String embeddingString = Arrays.toString(embedding);
        List<Note> similarNotes = repo.searchByEmbedding(note.getUserId(), embeddingString, 10);

        for (Note similar : similarNotes) {
            if (!similar.getId().equals(note.getId())) {
                float similarity = EmbeddingService.cosineSimilarity(embedding, similar.getEmbedding());

                // Only suggest if very similar (> 0.8) and NOT already linked
                if (similarity > 0.8 && linkRepo.findBySourceNoteIdOrderByRelevanceScoreDesc(note.getId()).stream()
                        .noneMatch(nl -> nl.getLinkedNoteId().equals(similar.getId()))) {
                    suggestionRepo.save(NoteSuggestion.builder()
                            .note(note)
                            .type("RELATED_NOTE")
                            .suggestionContent("Consider linking to note: " + similar.getTitle())
                            .build());
                }
            }
        }
    }

    private String extractTextFromNode(JsonNode node) {
        if (node == null) {
            return "";
        }
        if (node.isTextual()) {
            return node.asText();
        }
        if (node.isObject() && node.has("text")) {
            return node.get("text").asText();
        }
        StringBuilder sb = new StringBuilder();
        if (node.has("content")) {
            for (JsonNode child : node.get("content")) {
                sb.append(extractTextFromNode(child)).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
