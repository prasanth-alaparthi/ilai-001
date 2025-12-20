package com.muse.notes.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.muse.notes.dto.LabPersistentSaveRequest;
import com.muse.notes.entity.Note;
import com.muse.notes.entity.Notebook;
import com.muse.notes.entity.Section;
import com.muse.notes.service.NoteService;
import com.muse.notes.service.NotebookService;
import com.muse.notes.service.SectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Lab Persistent Save feature.
 * Handles auto-path directory creation and variable capture.
 */
@RestController
@RequestMapping("/api/notes/labs")
public class LabPersistentSaveController {

        private final NotebookService notebookService;
        private final SectionService sectionService;
        private final NoteService noteService;
        private final ObjectMapper objectMapper;

        public LabPersistentSaveController(
                        NotebookService notebookService,
                        SectionService sectionService,
                        NoteService noteService,
                        ObjectMapper objectMapper) {
                this.notebookService = notebookService;
                this.sectionService = sectionService;
                this.noteService = noteService;
                this.objectMapper = objectMapper;
        }

        /**
         * Persistent save endpoint for Lab research sessions.
         * 
         * Auto-pathing logic:
         * 1. Find or create Notebook (e.g., "Maths Lab")
         * 2. Find or create Section (e.g., "21-12-2024")
         * 3. Create Note with equation, solution, variables, and research
         */
        @PostMapping("/persistent-save")
        public ResponseEntity<Map<String, Object>> persistentSave(
                        @RequestBody LabPersistentSaveRequest request,
                        Authentication auth) {

                String username = auth.getName();
                LabPersistentSaveRequest.AutoPath autoPath = request.getAutoPath();

                if (autoPath == null) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "success", false,
                                        "error", "autoPath is required"));
                }

                try {
                        // Step 1: Find or create Notebook
                        String notebookName = autoPath.getNotebook() != null ? autoPath.getNotebook()
                                        : (request.getSubject() != null ? request.getSubject() + " Lab"
                                                        : "Research Lab");

                        Notebook notebook = notebookService.findOrCreateByName(username, notebookName);

                        // Step 2: Find or create Section (date-based)
                        String sectionName = autoPath.getSection() != null ? autoPath.getSection()
                                        : java.time.LocalDate.now().format(
                                                        java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));

                        Section section = sectionService.findOrCreateByName(notebook.getId(), username, sectionName);

                        if (section == null) {
                                return ResponseEntity.internalServerError().body(Map.of(
                                                "success", false,
                                                "error", "Failed to create section"));
                        }

                        // Step 3: Build note content
                        String noteTitle = autoPath.getTitle() != null ? autoPath.getTitle() : "Research Session";

                        ObjectNode noteContent = buildNoteContent(request);

                        // Step 4: Build summary with variable snapshot (since Note doesn't have
                        // metadata field)
                        StringBuilder summaryBuilder = new StringBuilder();
                        summaryBuilder.append("Lab Research Session\n");
                        if (request.getEquation() != null) {
                                summaryBuilder.append("Equation: ").append(request.getEquation()).append("\n");
                        }
                        if (request.getSolution() != null) {
                                summaryBuilder.append("Solution: ").append(request.getSolution()).append("\n");
                        }
                        if (request.getVariables() != null && !request.getVariables().isEmpty()) {
                                summaryBuilder.append("Variables: ");
                                for (Map.Entry<String, Object> entry : request.getVariables().entrySet()) {
                                        summaryBuilder.append(entry.getKey()).append("=").append(entry.getValue())
                                                        .append(", ");
                                }
                                summaryBuilder.append("\n");
                        }
                        summaryBuilder.append("Source: ResearchLab");

                        // Step 5: Create the note using NoteService.createInSection
                        var savedNoteOpt = noteService.createInSection(
                                        section.getId(),
                                        username,
                                        noteTitle,
                                        noteContent);

                        if (savedNoteOpt.isEmpty()) {
                                return ResponseEntity.internalServerError().body(Map.of(
                                                "success", false,
                                                "error", "Failed to create note"));
                        }

                        Note savedNote = savedNoteOpt.get();

                        // Update tags and summary separately
                        savedNote.setTags(
                                        new String[] { "lab-research", notebookName.toLowerCase().replace(" ", "-") });
                        savedNote.setSummary(summaryBuilder.toString());

                        // Return success response
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("noteId", savedNote.getId());
                        response.put("notebookId", notebook.getId());
                        response.put("notebookName", notebook.getTitle());
                        response.put("sectionId", section.getId());
                        response.put("sectionName", section.getTitle());
                        response.put("path", notebookName + " / " + sectionName + " / " + noteTitle);
                        response.put("variablesCaptured",
                                        request.getVariables() != null ? request.getVariables().size() : 0);

                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        return ResponseEntity.internalServerError().body(Map.of(
                                        "success", false,
                                        "error", e.getMessage()));
                }
        }

        /**
         * Build TipTap-compatible note content from lab data.
         */
        private ObjectNode buildNoteContent(LabPersistentSaveRequest request) {
                ObjectNode doc = objectMapper.createObjectNode();
                doc.put("type", "doc");

                var content = doc.putArray("content");

                // Heading
                var heading = content.addObject();
                heading.put("type", "heading");
                heading.putObject("attrs").put("level", 1);
                var headingContent = heading.putArray("content");
                headingContent.addObject()
                                .put("type", "text")
                                .put("text", request.getAutoPath().getTitle() != null ? request.getAutoPath().getTitle()
                                                : "Research Session");

                // Equation section
                if (request.getEquation() != null && !request.getEquation().isBlank()) {
                        var eqHeading = content.addObject();
                        eqHeading.put("type", "heading");
                        eqHeading.putObject("attrs").put("level", 2);
                        eqHeading.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", "Equation");

                        var eqBlock = content.addObject();
                        eqBlock.put("type", "paragraph");
                        eqBlock.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", "$$" + request.getEquation() + "$$");
                }

                // Solution section
                if (request.getSolution() != null && !request.getSolution().isBlank()) {
                        var solHeading = content.addObject();
                        solHeading.put("type", "heading");
                        solHeading.putObject("attrs").put("level", 2);
                        solHeading.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", "Solution");

                        var solBlock = content.addObject();
                        solBlock.put("type", "paragraph");
                        solBlock.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", request.getSolution());
                }

                // Variables section
                if (request.getVariables() != null && !request.getVariables().isEmpty()) {
                        var varHeading = content.addObject();
                        varHeading.put("type", "heading");
                        varHeading.putObject("attrs").put("level", 2);
                        varHeading.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", "Variables");

                        var varList = content.addObject();
                        varList.put("type", "bulletList");
                        var listContent = varList.putArray("content");

                        for (Map.Entry<String, Object> entry : request.getVariables().entrySet()) {
                                var listItem = listContent.addObject();
                                listItem.put("type", "listItem");
                                var itemPara = listItem.putArray("content").addObject();
                                itemPara.put("type", "paragraph");
                                itemPara.putArray("content").addObject()
                                                .put("type", "text")
                                                .put("text", entry.getKey() + " = " + entry.getValue());
                        }
                }

                // Research results section
                if (request.getResearchResults() != null && !request.getResearchResults().isBlank()) {
                        var resHeading = content.addObject();
                        resHeading.put("type", "heading");
                        resHeading.putObject("attrs").put("level", 2);
                        resHeading.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", "Research Results");

                        var resBlock = content.addObject();
                        resBlock.put("type", "paragraph");
                        resBlock.putArray("content").addObject()
                                        .put("type", "text")
                                        .put("text", request.getResearchResults());
                }

                return doc;
        }
}
