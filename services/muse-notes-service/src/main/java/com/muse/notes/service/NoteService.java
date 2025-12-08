package com.muse.notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.notes.entity.*;
import com.muse.notes.repository.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoteService {

    private final NoteRepository repo;
    private final SectionRepository sectionRepo;
    private final NotebookRepository notebookRepo;
    private final EmbeddingService embeddingService;
    private final NotePermissionRepository permissionRepo;
    private final NoteVersionRepository versionRepo;
    private final NoteLinkRepository linkRepo;
    private final NoteSuggestionRepository suggestionRepo;
    private final NoteCalendarLinkRepository calendarLinkRepo;
    private final NoteSocketHandler noteSocketHandler;
    private final ObjectMapper objectMapper;
    private final GeminiService geminiService;
    private final TransactionTemplate transactionTemplate;

    public NoteService(NoteRepository repo,
            SectionRepository sectionRepo,
            NotebookRepository notebookRepo,
            EmbeddingService embeddingService,
            NotePermissionRepository permissionRepo,
            NoteVersionRepository versionRepo,
            NoteLinkRepository linkRepo,
            NoteSuggestionRepository suggestionRepo,
            NoteCalendarLinkRepository calendarLinkRepo,
            NoteSocketHandler noteSocketHandler,
            ObjectMapper objectMapper,
            GeminiService geminiService,
            TransactionTemplate transactionTemplate) {
        this.repo = repo;
        this.sectionRepo = sectionRepo;
        this.notebookRepo = notebookRepo;
        this.embeddingService = embeddingService;
        this.permissionRepo = permissionRepo;
        this.versionRepo = versionRepo;
        this.linkRepo = linkRepo;
        this.suggestionRepo = suggestionRepo;
        this.calendarLinkRepo = calendarLinkRepo;
        this.noteSocketHandler = noteSocketHandler;
        this.objectMapper = objectMapper;
        this.geminiService = geminiService;
        this.transactionTemplate = transactionTemplate;
    }

    private Section getOrCreateDefaultSection(String username) {
        Instant now = Instant.now();

        Notebook notebook = notebookRepo
                .findByOwnerUsernameOrderByOrderIndexAsc(username)
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    int nextOrderIndex = notebookRepo.findMaxOrderIndexByOwnerUsername(username) + 1;
                    Notebook nb = new Notebook();
                    nb.setOwnerUsername(username);
                    nb.setTitle("My notes");
                    nb.setColor("#6366f1");
                    nb.setCreatedAt(now);
                    nb.setUpdatedAt(now);
                    nb.setOrderIndex(nextOrderIndex);
                    return notebookRepo.save(nb);
                });

        String defaultSectionTitle = "General";
        return sectionRepo
                .findByNotebookAndTitle(notebook, defaultSectionTitle)
                .orElseGet(() -> {
                    int nextOrderIndex = sectionRepo.findMaxOrderIndexByNotebookId(notebook.getId()) + 1;
                    Section s = new Section();
                    s.setNotebook(notebook);
                    s.setTitle(defaultSectionTitle);
                    s.setCreatedAt(now);
                    s.setUpdatedAt(now);
                    s.setOrderIndex(nextOrderIndex);
                    return sectionRepo.save(s);
                });
    }

    public List<Note> listNotes(String username) {
        return repo.findByOwnerUsernameOrderByOrderIndexAsc(username);
    }

    public List<Note> listNotesInSection(Long sectionId, String username) {
        return repo.findBySectionIdAndOwnerUsernameOrderByOrderIndexAsc(sectionId, username);
    }

    public Note createNote(String username, String title, JsonNode content) {
        Instant now = Instant.now();
        Section defaultSection = getOrCreateDefaultSection(username);
        int nextOrderIndex = repo.findMaxOrderIndexBySectionId(defaultSection.getId()) + 1;

        Note n = new Note();
        n.setOwnerUsername(username);
        n.setSection(defaultSection);
        n.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
        n.setContent(content);
        n.setCreatedAt(now);
        n.setUpdatedAt(now);
        n.setOrderIndex(nextOrderIndex);

        Note savedNote = repo.save(n);
        updateNoteLinks(savedNote);
        analyzeNoteContentAsync(savedNote);
        return savedNote;
    }

    public Optional<Note> createInSection(Long sectionId, String username, String title, JsonNode content) {
        return sectionRepo.findByIdAndNotebookOwnerUsername(sectionId, username)
                .map(sec -> {
                    Instant now = Instant.now();
                    int nextOrderIndex = repo.findMaxOrderIndexBySectionId(sectionId) + 1;
                    Note n = new Note();
                    n.setOwnerUsername(username);
                    n.setSection(sec);
                    n.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
                    n.setContent(content);
                    n.setCreatedAt(now);
                    n.setUpdatedAt(now);
                    n.setOrderIndex(nextOrderIndex);

                    Note savedNote = repo.save(n);
                    updateNoteLinks(savedNote);
                    analyzeNoteContentAsync(savedNote);
                    return savedNote;
                });
    }

    public Optional<Note> updateNote(Long id, String username, String title, JsonNode content) {
        return repo.findByIdAndOwnerUsername(id, username).map(n -> {
            NoteVersion version = NoteVersion.builder()
                    .note(n)
                    .title(n.getTitle())
                    .content(n.getContent())
                    .build();
            versionRepo.save(version);

            if (title != null && !title.isBlank()) {
                n.setTitle(title);
            }
            if (content != null) {
                n.setContent(content);
            }
            n.setUpdatedAt(Instant.now());
            Note updatedNote = repo.save(n);

            updateNoteLinks(updatedNote);
            analyzeNoteContentAsync(updatedNote);

            try {
                String message = objectMapper.writeValueAsString(updatedNote);
                noteSocketHandler.broadcast(updatedNote.getId().toString(), message, null);
            } catch (IOException e) {
                // Log error, but don't fail the transaction
            }

            return updatedNote;
        });
    }

    private void updateNoteLinks(Note note) {
        embeddingService.getEmbedding(extractTextFromNode(note.getContent())).subscribe(embedding -> {
            transactionTemplate.executeWithoutResult(status -> {
                String embeddingString = Arrays.toString(embedding);
                List<Note> relatedNotes = repo.searchByEmbedding(note.getOwnerUsername(), embeddingString, 5);
                linkRepo.deleteBySourceNoteId(note.getId());
                for (Note related : relatedNotes) {
                    if (!related.getId().equals(note.getId())) {
                        NoteLink link = NoteLink.builder()
                                .sourceNoteId(note.getId())
                                .linkedNoteId(related.getId())
                                .relevanceScore(0.0f) // Placeholder, a real implementation would calculate this
                                .build();
                        linkRepo.save(link);
                    }
                }
            });
        });
    }

    @Async
    public void analyzeNoteContentAsync(Note note) {
        // Clear previous suggestions for this note
        suggestionRepo.deleteByNoteId(note.getId());

        // Example 1: Suggest linking to a semantically similar note if not already
        // linked
        embeddingService.getEmbedding(extractTextFromNode(note.getContent())).subscribe(embedding -> {
            transactionTemplate.executeWithoutResult(status -> {
                // Save embedding to note
                // Need to re-fetch note to ensure we are updating the latest state and avoiding
                // detached entity issues
                repo.findById(note.getId()).ifPresent(n -> {
                    n.setEmbedding(embedding);
                    repo.save(n);
                });

                String embeddingString = Arrays.toString(embedding);
                List<Note> similarNotes = repo.searchByEmbedding(note.getOwnerUsername(), embeddingString, 3);
                for (Note similar : similarNotes) {
                    if (!similar.getId().equals(note.getId())
                            && linkRepo.findBySourceNoteIdOrderByRelevanceScoreDesc(note.getId()).stream()
                            .noneMatch(nl -> nl.getLinkedNoteId().equals(similar.getId()))) {
                        suggestionRepo.save(NoteSuggestion.builder()
                                .note(note)
                                .type("RELATED_NOTE")
                                .suggestionContent("Consider linking to note: " + similar.getTitle() + " (ID: "
                                        + similar.getId() + ")")
                                .build());
                    }
                }
            });
        });

        // Example 2: Simple keyword-based suggestion (e.g., for tasks)
        if (note.getContent() != null && note.getContent().asText().contains("TODO")) {
            suggestionRepo.save(NoteSuggestion.builder()
                    .note(note)
                    .type("TASK_REMINDER")
                    .suggestionContent("Found 'TODO' in your note. Consider adding a task.")
                    .build());
        }
    }

    public boolean deleteNote(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(n -> {
            repo.delete(n);
            return true;
        }).orElse(false);
    }

    public Optional<Note> getNote(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username);
    }

    public List<Note> searchNotes(String username, String query) {
        String tsQuery = query.trim().replaceAll("\\s+", "&");
        return repo.searchByQuery(username, tsQuery);
    }

    public Mono<List<Note>> semanticSearch(String username, String query, int limit) {
        return embeddingService.getEmbedding(query)
                .map(embedding -> {
                    String embeddingString = Arrays.toString(embedding);
                    return repo.searchByEmbedding(username, embeddingString, limit);
                });
    }

    public List<Note> getPinnedNotes(String username) {
        return repo.findByOwnerUsernameAndIsPinnedTrueOrderByUpdatedAtDesc(username);
    }

    public Optional<Note> togglePin(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(n -> {
            n.setPinned(!n.isPinned());
            n.setUpdatedAt(Instant.now());
            return repo.save(n);
        });
    }

    public Optional<NotePermission> shareNote(Long noteId, String ownerUsername, String sharedWithUsername,
            NotePermission.PermissionLevel permissionLevel) {
        return repo.findByIdAndOwnerUsername(noteId, ownerUsername)
                .map(note -> {
                    NotePermission permission = permissionRepo.findByNoteIdAndUsername(noteId, sharedWithUsername)
                            .orElse(new NotePermission());
                    permission.setNote(note);
                    permission.setUsername(sharedWithUsername);
                    permission.setPermissionLevel(permissionLevel);
                    return permissionRepo.save(permission);
                });
    }

    public boolean canView(Long noteId, String username) {
        return repo.findById(noteId)
                .map(note -> note.getOwnerUsername().equals(username) ||
                        permissionRepo.findByNoteIdAndUsername(noteId, username).isPresent())
                .orElse(false);
    }

    public boolean canEdit(Long noteId, String username) {
        return repo.findById(noteId)
                .map(note -> note.getOwnerUsername().equals(username) ||
                        permissionRepo.findByNoteIdAndUsername(noteId, username)
                                .map(p -> p.getPermissionLevel() == NotePermission.PermissionLevel.EDITOR)
                                .orElse(false))
                .orElse(false);
    }

    public List<NoteVersion> getNoteVersions(Long noteId, String username) {
        return repo.findByIdAndOwnerUsername(noteId, username)
                .map(note -> versionRepo.findByNoteIdOrderByCreatedAtDesc(noteId))
                .orElse(List.of());
    }

    public Optional<Note> restoreNoteVersion(Long versionId, String username) {
        return versionRepo.findById(versionId)
                .flatMap(version -> repo.findByIdAndOwnerUsername(version.getNote().getId(), username)
                        .map(note -> {
                            note.setTitle(version.getTitle());
                            note.setContent(version.getContent());
                            note.setUpdatedAt(Instant.now());
                            return repo.save(note);
                        }));
    }

    @Transactional
    public void updateNoteOrder(List<Long> noteIds, String username) {
        List<Note> notes = repo.findAllById(noteIds);
        Map<Long, Note> noteMap = notes.stream()
                .collect(Collectors.toMap(Note::getId, Function.identity()));

        for (int i = 0; i < noteIds.size(); i++) {
            Long id = noteIds.get(i);
            Note note = noteMap.get(id);
            if (note != null && note.getOwnerUsername().equals(username)) {
                note.setOrderIndex(i);
            }
        }
        repo.saveAll(notes);
    }

    public List<NoteLink> getBacklinks(Long noteId, String username) {
        return repo.findByIdAndOwnerUsername(noteId, username)
                .map(note -> linkRepo.findByLinkedNoteIdOrderByRelevanceScoreDesc(noteId))
                .orElse(List.of());
    }

    public long countNotesForUser(String username) {
        return repo.countByOwnerUsername(username);
    }

    public List<NoteSuggestion> getNoteSuggestions(Long noteId) {
        return suggestionRepo.findByNoteIdOrderByCreatedAtDesc(noteId);
    }

    public Optional<NoteCalendarLink> linkNoteToCalendar(Long noteId, String username, String calendarEventId,
            String calendarProvider) {
        return repo.findByIdAndOwnerUsername(noteId, username)
                .map(note -> {
                    NoteCalendarLink link = calendarLinkRepo
                            .findByNoteIdAndCalendarEventIdAndCalendarProvider(noteId, calendarEventId,
                                    calendarProvider)
                            .orElse(new NoteCalendarLink());
                    link.setNote(note);
                    link.setCalendarEventId(calendarEventId);
                    link.setCalendarProvider(calendarProvider);
                    return calendarLinkRepo.save(link);
                });
    }

    public Mono<com.muse.notes.dto.AskQuestionResponse> askNotes(String username, String question) {
        return embeddingService.getEmbedding(question)
                .flatMap(embedding -> {
                    String embeddingString = Arrays.toString(embedding);
                    // Search for top 5 relevant notes
                    List<Note> relevantNotes = repo.searchByEmbedding(username, embeddingString, 5);

                    StringBuilder contextBuilder = new StringBuilder();
                    contextBuilder.append(
                            "You are a helpful tutor. Answer the student's question based ONLY on the following notes. If the answer is not in the notes, say 'I couldn't find the answer in your notes.'\n\n");

                    List<com.muse.notes.dto.AskQuestionResponse.SourceNote> sources = new java.util.ArrayList<>();

                    for (Note note : relevantNotes) {
                        String noteText = extractTextFromNode(note.getContent());

                        contextBuilder.append("--- Note: ").append(note.getTitle()).append(" ---\n");
                        contextBuilder.append(noteText).append("\n\n");

                        String excerpt = "";
                        if (noteText != null && !noteText.isEmpty()) {
                            excerpt = noteText.substring(0, Math.min(noteText.length(), 100)) + "...";
                        }

                        sources.add(com.muse.notes.dto.AskQuestionResponse.SourceNote.builder()
                                .id(note.getId())
                                .title(note.getTitle())
                                .excerpt(excerpt)
                                .build());
                    }

                    contextBuilder.append("Question: ").append(question).append("\nAnswer:");

                    return geminiService.generateContent(contextBuilder.toString())
                            .map(answer -> com.muse.notes.dto.AskQuestionResponse.builder()
                                    .answer(answer)
                                    .sources(sources)
                                    .build());
                });
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

    public List<NoteCalendarLink> getCalendarLinksForNote(Long noteId, String username) {
        return repo.findByIdAndOwnerUsername(noteId, username)
                .map(note -> calendarLinkRepo.findByNoteId(noteId))
                .orElse(List.of());
    }

    public boolean unlinkNoteFromCalendar(Long linkId, String username) {
        return calendarLinkRepo.findById(linkId)
                .filter(link -> link.getNote().getOwnerUsername().equals(username))
                .map(link -> {
                    calendarLinkRepo.delete(link);
                    return true;
                })
                .orElse(false);
    }

    public boolean exists(Long id) {
        return repo.existsById(id);
    }
}
