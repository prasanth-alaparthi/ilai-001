package com.muse.notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.notes.dto.NoteLinkDto;
import com.muse.notes.entity.*;
import com.muse.notes.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.time.Instant;
import java.util.*;
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
    private final NoteAnalysisService noteAnalysisService;
    private final GeminiService geminiService;

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
            NoteAnalysisService noteAnalysisService) {
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
        this.noteAnalysisService = noteAnalysisService;
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
        updateNoteLinksAsync(savedNote);
        noteAnalysisService.analyzeNoteContentAsync(savedNote.getId());
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
                    updateNoteLinksAsync(savedNote);
                    noteAnalysisService.analyzeNoteContentAsync(savedNote.getId());
                    return savedNote;
                });
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NoteService.class);

    /**
     * Update a note - SIMPLIFIED for reliable persistence
     * Async operations (embeddings, analysis) run AFTER save completes
     */
    @CacheEvict(value = "notes", key = "#id + '_' + #username")
    public Optional<Note> updateNote(Long id, String username, String title, JsonNode content) {
        log.info("updateNote called: id={}, username={}, title={}, contentLength={}",
                id, username, title, content != null ? content.toString().length() : "null");

        Optional<Note> result = repo.findByIdAndOwnerUsername(id, username).map(n -> {
            log.info("Found note to update: id={}, currentTitle={}", n.getId(), n.getTitle());

            String oldTitle = n.getTitle();
            boolean titleChanged = title != null && !title.isBlank() && !title.equals(oldTitle);

            // Save version history
            try {
                NoteVersion version = NoteVersion.builder()
                        .note(n)
                        .title(n.getTitle())
                        .content(n.getContent())
                        .build();
                versionRepo.save(version);
            } catch (Exception e) {
                log.warn("Failed to save note version, continuing with update", e);
            }

            // Update note fields
            if (title != null && !title.isBlank()) {
                n.setTitle(title);
            }
            if (content != null) {
                log.info("Setting new content, length={}", content.toString().length());
                n.setContent(content);
            }
            n.setUpdatedAt(Instant.now());

            // CRITICAL: Use saveAndFlush to ensure immediate persistence
            Note savedNote = repo.saveAndFlush(n);
            log.info("Note FLUSHED to DB: id={}, updatedAt={}", savedNote.getId(), savedNote.getUpdatedAt());

            if (titleChanged) {
                propagateTitleChangeAsync(username, oldTitle, title);
            }

            return savedNote;
        });

        // Run async operations AFTER the main save completes
        result.ifPresent(note -> {
            try {
                // These run async and won't block/affect the save
                runPostSaveOperationsAsync(note.getId());
            } catch (Exception e) {
                log.warn("Failed to trigger post-save operations", e);
            }
        });

        return result;
    }

    private void propagateTitleChangeAsync(String username, String oldTitle, String newTitle) {
        CompletableFuture.runAsync(() -> {
            try {
                // Regex to find [[oldTitle]] or [[oldTitle|Alias]]
                // Pattern matches [[, then exactly oldTitle, then optionally | followed by
                // anything until ]], then ]]
                String escapedOldTitle = java.util.regex.Pattern.quote(oldTitle);
                String patternString = "\\[\\[" + escapedOldTitle + "(\\|.*?)?\\]\\]";
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(patternString);

                List<Note> allNotes = repo.findByOwnerUsernameAndDeletedAtIsNullOrderByOrderIndexAsc(username);
                for (Note note : allNotes) {
                    if (note.getContent() == null)
                        continue;
                    String contentString = note.getContent().toString();
                    java.util.regex.Matcher matcher = pattern.matcher(contentString);

                    if (matcher.find()) {
                        // Use appendReplacement logic to handle multiple occurrences
                        StringBuilder sb = new StringBuilder();
                        matcher.reset();
                        while (matcher.find()) {
                            String aliasPart = matcher.group(1);
                            String replacement = "[[" + newTitle + (aliasPart != null ? aliasPart : "") + "]]";
                            matcher.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(replacement));
                        }
                        matcher.appendTail(sb);

                        note.setContent(objectMapper.readTree(sb.toString()));
                        repo.save(note);
                        log.info("Propagated title change with ALIAS support to note {}", note.getId());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to propagate title change for user {}", username, e);
            }
        });
    }

    /**
     * Post-save async operations - runs after transaction commits
     * Failures here won't affect the save
     */
    @Async
    public void runPostSaveOperationsAsync(Long noteId) {
        try {
            repo.findById(noteId).ifPresent(note -> {
                // Update embeddings and links (async, non-blocking)
                updateNoteLinksAsync(note);

                // Run AI analysis
                noteAnalysisService.analyzeNoteContentAsync(noteId);

                // Broadcast via WebSocket
                try {
                    String message = objectMapper.writeValueAsString(note);
                    noteSocketHandler.broadcast(note.getId().toString(), message, null);
                } catch (IOException e) {
                    log.warn("Failed to broadcast note update", e);
                }
            });
        } catch (Exception e) {
            log.error("Post-save operations failed for note {}", noteId, e);
        }
    }

    private void updateNoteLinksAsync(Note note) {
        String noteText = extractTextFromNode(note.getContent());
        embeddingService.getEmbedding(noteText).subscribe(
                embedding -> {
                    try {
                        String embeddingString = Arrays.toString(embedding);
                        List<Note> relatedNotes = repo.searchByEmbedding(note.getOwnerUsername(), embeddingString, 10);

                        // Extract manual links from JSON content (TipTap structured links)
                        Set<Long> manualLinkIds = extractManualLinkIds(note.getContent());

                        // Extract Wiki Links [[Title]] from content
                        Set<Long> wikiLinkIds = extractWikiLinkIds(note.getOwnerUsername(), noteText);
                        manualLinkIds.addAll(wikiLinkIds);

                        linkRepo.deleteBySourceNoteId(note.getId());

                        // Add manual/wiki links first (high relevance)
                        for (Long targetId : manualLinkIds) {
                            if (!targetId.equals(note.getId())) {
                                linkRepo.save(NoteLink.builder()
                                        .sourceNoteId(note.getId())
                                        .linkedNoteId(targetId)
                                        .relevanceScore(1.0f)
                                        .build());
                            }
                        }

                        // Add semantic links (calculate actual relevance using cosine similarity)
                        for (Note related : relatedNotes) {
                            if (!related.getId().equals(note.getId()) && !manualLinkIds.contains(related.getId())) {
                                float similarity = EmbeddingService.cosineSimilarity(embedding, related.getEmbedding());
                                // Only add if similarity is above a threshold
                                if (similarity > 0.6) {
                                    NoteLink link = NoteLink.builder()
                                            .sourceNoteId(note.getId())
                                            .linkedNoteId(related.getId())
                                            .relevanceScore(similarity)
                                            .build();
                                    linkRepo.save(link);
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to update note links for note {}", note.getId(), e);
                    }
                },
                error -> log.warn("Failed to get embedding for note {}", note.getId(), error));
    }

    private Set<Long> extractWikiLinkIds(String username, String text) {
        Set<Long> ids = new HashSet<>();
        if (text == null || text.isBlank())
            return ids;

        // Match [[Title]] or [[Title|Alias]]
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\[\\[(.*?)(?:\\|(.*?))?\\]\\]");
        java.util.regex.Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String title = matcher.group(1).trim();
            repo.findByOwnerUsernameAndTitleIgnoreCaseAndDeletedAtIsNull(username, title)
                    .ifPresent(n -> ids.add(n.getId()));
        }
        return ids;
    }

    private Set<Long> extractManualLinkIds(JsonNode node) {
        Set<Long> ids = new HashSet<>();
        if (node == null || node.isNull())
            return ids;

        if (node.isObject()) {
            // Check for TipTap-style links: { type: "text", marks: [{ type: "link", attrs:
            // {
            // "data-note-id": ... } }] }
            if (node.has("marks") && node.get("marks").isArray()) {
                for (JsonNode mark : node.get("marks")) {
                    if (mark.has("type") && mark.get("type").asText().equals("link") && mark.has("attrs")) {
                        JsonNode attrs = mark.get("attrs");
                        if (attrs.has("data-note-id")) {
                            ids.add(attrs.get("data-note-id").asLong());
                        }
                    }
                }
            }
            // Recurse into content
            if (node.has("content") && node.get("content").isArray()) {
                for (JsonNode child : node.get("content")) {
                    ids.addAll(extractManualLinkIds(child));
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                ids.addAll(extractManualLinkIds(child));
            }
        }
        return ids;
    }

    @CacheEvict(value = "notes", key = "#id + '_' + #username")
    public boolean deleteNote(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(n -> {
            // Clean up all related entities before deleting to prevent orphaned data
            linkRepo.deleteBySourceNoteId(id); // Links FROM this note
            linkRepo.deleteByLinkedNoteId(id); // Links TO this note (backlinks)
            suggestionRepo.deleteByNoteId(id); // AI suggestions
            versionRepo.deleteByNoteId(id); // Version history
            calendarLinkRepo.deleteByNoteId(id); // Calendar associations
            permissionRepo.deleteByNoteId(id); // Share permissions

            repo.delete(n);
            log.info("Deleted note {} and cleaned up all related data (links, versions, permissions, calendar)", id);
            return true;
        }).orElse(false);
    }

    @Cacheable(value = "notes", key = "#id + '_' + #username")
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

    @Cacheable(value = "note_backlinks", key = "#noteId + '_' + #username")
    public List<NoteLink> getBacklinks(Long noteId, String username) {
        return repo.findByIdAndOwnerUsername(noteId, username)
                .map(note -> linkRepo.findByLinkedNoteIdOrderByRelevanceScoreDesc(noteId))
                .orElse(List.of());
    }

    @Cacheable(value = "note_links_all", key = "#noteId + '_' + #username")
    public Map<String, List<NoteLinkDto>> getAllLinks(Long noteId, String username) {
        return repo.findByIdAndOwnerUsername(noteId, username)
                .map(note -> {
                    Map<String, List<NoteLinkDto>> links = new HashMap<>();
                    List<NoteLink> outgoing = linkRepo.findBySourceNoteIdOrderByRelevanceScoreDesc(noteId);
                    List<NoteLink> incoming = linkRepo.findByLinkedNoteIdOrderByRelevanceScoreDesc(noteId);

                    links.put("outgoing", convertToDto(outgoing));
                    links.put("incoming", convertToDto(incoming));
                    return links;
                })
                .orElse(Map.of("outgoing", List.of(), "incoming", List.of()));
    }

    private List<NoteLinkDto> convertToDto(List<NoteLink> links) {
        if (links.isEmpty())
            return List.of();

        Set<Long> ids = new HashSet<>();
        for (NoteLink l : links) {
            ids.add(l.getSourceNoteId());
            ids.add(l.getLinkedNoteId());
        }

        Map<Long, String> titles = repo.findAllById(ids).stream()
                .collect(Collectors.toMap(Note::getId, Note::getTitle));

        return links.stream().map(link -> NoteLinkDto.builder()
                .sourceNoteId(link.getSourceNoteId())
                .sourceNoteTitle(titles.getOrDefault(link.getSourceNoteId(), "Deleted Note"))
                .targetNoteId(link.getLinkedNoteId())
                .targetNoteTitle(titles.getOrDefault(link.getLinkedNoteId(), "Deleted Note"))
                .relevanceScore(link.getRelevanceScore())
                .manual(link.getRelevanceScore() >= 1.0f)
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public Optional<NoteLink> createManualLink(Long sourceId, Long targetId, String username) {
        return repo.findByIdAndOwnerUsername(sourceId, username)
                .flatMap(source -> repo.findById(targetId)
                        .map(target -> {
                            NoteLink link = NoteLink.builder()
                                    .sourceNoteId(sourceId)
                                    .linkedNoteId(targetId)
                                    .relevanceScore(1.0f)
                                    .build();
                            return linkRepo.save(link);
                        }));
    }

    @Transactional
    public boolean removeManualLink(Long sourceId, Long targetId, String username) {
        return repo.findByIdAndOwnerUsername(sourceId, username).map(n -> {
            linkRepo.deleteBySourceNoteIdAndLinkedNoteId(sourceId, targetId);
            return true;
        }).orElse(false);
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

    public String extractTextFromNode(JsonNode node) {
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

    public List<Map<String, Object>> getBrokenLinks(String username) {
        List<Note> notes = repo.findByOwnerUsernameAndDeletedAtIsNullOrderByOrderIndexAsc(username);
        List<Map<String, Object>> broken = new ArrayList<>();

        for (Note note : notes) {
            String text = extractTextFromNode(note.getContent());
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\[\\[(.*?)(?:\\|(.*?))?\\]\\]");
            java.util.regex.Matcher matcher = pattern.matcher(text);

            while (matcher.find()) {
                String title = matcher.group(1).trim();
                if (repo.findByOwnerUsernameAndTitleIgnoreCaseAndDeletedAtIsNull(username, title).isEmpty()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("sourceNoteId", note.getId());
                    item.put("sourceNoteTitle", note.getTitle());
                    item.put("targetTitle", title);
                    broken.add(item);
                }
            }
        }
        return broken;
    }

    public boolean exists(Long id) {
        return repo.existsById(id);
    }

    public Map<String, Object> getUserGraph(String username) {
        List<Note> notes = repo.findByOwnerUsernameAndDeletedAtIsNullOrderByOrderIndexAsc(username);
        List<NoteLink> links = linkRepo.findAllBySourceUser(username);

        Set<Long> validNoteIds = notes.stream().map(Note::getId).collect(Collectors.toSet());

        List<Map<String, Object>> nodes = notes.stream().map(n -> {
            Map<String, Object> node = new HashMap<>();
            node.put("id", n.getId());
            node.put("title", n.getTitle());
            node.put("section", n.getSection() != null ? n.getSection().getTitle() : "Default");
            node.put("isPinned", n.isPinned());
            return node;
        }).collect(Collectors.toList());

        List<Map<String, Object>> edges = links.stream()
                .filter(l -> validNoteIds.contains(l.getSourceNoteId()) && validNoteIds.contains(l.getLinkedNoteId()))
                .map(l -> {
                    Map<String, Object> edge = new HashMap<>();
                    edge.put("source", l.getSourceNoteId());
                    edge.put("target", l.getLinkedNoteId());
                    edge.put("relevance", l.getRelevanceScore());
                    return edge;
                }).collect(Collectors.toList());

        Map<String, Object> graph = new HashMap<>();
        graph.put("nodes", nodes);
        graph.put("links", edges);
        return graph;
    }

    // ==================== Trash / Soft Delete ====================

    @CacheEvict(value = "notes", key = "#id + '_' + #username")
    public boolean moveToTrash(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(note -> {
            note.setDeletedAt(Instant.now());
            repo.save(note);
            log.info("Moved note {} to trash", id);
            return true;
        }).orElse(false);
    }

    @CacheEvict(value = "notes", key = "#id + '_' + #username")
    public boolean restoreFromTrash(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(note -> {
            if (note.getDeletedAt() == null)
                return false;
            note.setDeletedAt(null);
            repo.save(note);
            log.info("Restored note {} from trash", id);
            return true;
        }).orElse(false);
    }

    public List<Note> getTrash(String username) {
        return repo.findByOwnerUsernameAndDeletedAtIsNotNullOrderByDeletedAtDesc(username);
    }

    @Transactional
    public int emptyTrash(String username) {
        List<Note> trashed = repo.findByOwnerUsernameAndDeletedAtIsNotNullOrderByDeletedAtDesc(username);
        int count = 0;
        for (Note note : trashed) {
            deleteNote(note.getId(), username); // Properly cleans up all related data
            count++;
        }
        log.info("Emptied trash for user {}: {} notes permanently deleted", username, count);
        return count;
    }

    // ==================== Tags ====================

    public Optional<Note> updateTags(Long id, String username, String[] tags) {
        return repo.findByIdAndOwnerUsername(id, username).map(note -> {
            note.setTags(tags);
            note.setUpdatedAt(Instant.now());
            return repo.save(note);
        });
    }

    public List<Note> getNotesByTag(String username, String tag) {
        return repo.findByOwnerUsernameAndTag(username, tag);
    }

    // ==================== Duplicate ====================

    public Optional<Note> duplicateNote(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(original -> {
            Instant now = Instant.now();
            Note copy = new Note();
            copy.setTitle(original.getTitle() + " (Copy)");
            copy.setContent(original.getContent());
            copy.setOwnerUsername(username);
            copy.setSection(original.getSection());
            copy.setExcerpt(original.getExcerpt());
            copy.setTags(original.getTags() != null ? original.getTags().clone() : null);
            copy.setCreatedAt(now);
            copy.setUpdatedAt(now);
            copy.setOrderIndex(repo.findMaxOrderIndexBySectionId(original.getSection().getId()) + 1);
            copy.setPinned(false);
            Note saved = repo.save(copy);
            log.info("Duplicated note {} -> new note {}", id, saved.getId());
            return saved;
        });
    }

    public Optional<Note> findByTitle(String username, String title) {
        return repo.findByOwnerUsernameAndTitleIgnoreCaseAndDeletedAtIsNull(username, title);
    }
}
