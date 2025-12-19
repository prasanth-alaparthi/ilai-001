# Implementation Plan: Notes & Journal Service Audit Fixes

This document outlines the phased implementation strategy to address the gaps identified during the `muse-notes-service` audit.

---

## Phase 1: Stability & Data Integrity (High Priority)

### 1. Unified Trash System for Notebooks & Sections
*   **Goal**: Prevent accidental permanent deletion of entire notebooks.
*   **Actions**:
    *   Add `deletedAt` column to `notebooks` and `sections` tables.
    *   Update `NotebookService` and `SectionService` to implement `moveToTrash` and `restoreFromTrash` methods instead of direct deletion.
    *   Update `TrashPage.jsx` to display deleted notebooks alongside notes.

### 2. Attachment Lifecycle Management
*   **Goal**: Prevent storage leaks by cleaning up files when notes are purged.
*   **Actions**:
    *   Update `Attachment` entity to include a `note_id` foreign key (optional) or ensure `AttachmentRepository` can find files by `ownerUsername`.
    *   Modify `NoteService.emptyTrash` to trigger `storageService.deleteFile` for all linked attachments.

### 3. Basic Collaboration Locking
*   **Goal**: Prevent "Last-Write-Wins" data loss in WebSocket sessions.
*   **Actions**:
    *   Implement "Active User" indicators in the UI.
    *   Add a "Locked by [User]" status when someone is actively typing, preventing others from saving until the lock is released or times out.

---

## Phase 2: AI Feature Completion

### 4. Audio Transcription (OpenAI Whisper / Google STT)
*   **Goal**: Convert voice notes and lecture recordings to text.
*   **Actions**:
    *   Implement logic in `AiController.transcribe` to forward multipart files to an STT API.
    *   Add a processing queue for long audio files to avoid HTTP timeouts.

### 5. Task Extraction (Human-in-the-Loop)
*   **Goal**: Turn "TODO" comments into actionable tasks.
*   **Actions**:
    *   Enhance `NoteAnalysisService` to use a Gemini prompt that extracts specific tasks: `[ { "task": "Project report", "dueDate": "2023-12-10" } ]`.
    *   Create a `Task` entity and `/api/tasks` endpoint to aggregate these across the app.

### 6. Podcast/Audio Overview Execution
*   **Goal**: Generate actual audio files from scripts.
*   **Actions**:
    *   Implement a TTS (Text-to-Speech) service in the backend using Google Cloud TTS or Gemini Multimodal (if available).
    *   Update `AIToolsPanel.jsx` to include an audio player for generated overviews.

---

## Phase 3: Academic & Productivity Tools

### 7. Reminder Scheduler
*   **Goal**: Make Journal reminders functional.
*   **Actions**:
    *   Enable `@EnableScheduling` in the main application.
    *   Create a `ReminderJob` that scans the `JournalReminder` table every minute and sends WebSocket/Push notifications.

### 8. Academic Export Engine
*   **Goal**: Professional document generation.
*   **Actions**:
    *   Implement Markdown and PDF export for Notes using `CommonMark` and `OpenPDF`.
    *   Add a "Submit to Course" feature that bundles a note and its attachments into a zip for the `muse-classroom-service`.

---

## Phase 4: Frontend Visualization

### 9. Interactive Knowledge Graph
*   **Goal**: Visual navigation of note links.
*   **Actions**:
    *   Integrate `react-force-graph` or `react-flow` into the `KnowledgeGraph` component.
    *   Allow users to click nodes to jump directly to specific notes.

### 10. Mood & Activity Analytics
*   **Goal**: Reflection insights for students.
*   **Actions**:
    *   Enable the `/api/journal/mood/summary` endpoint.
    *   Add `recharts` to the Journal Home page to show mood trends over the last 30 days.
