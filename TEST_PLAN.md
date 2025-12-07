# Comprehensive Test Plan for Muse-004

## 1. Backend Verification (Automated)
We have verified that the core services build and pass their unit tests.

- **Auth Service**: ✅ Passed (Fixed compilation error in `FollowController`)
- **Notes Service**: ✅ Passed

### Recommended Action:
Run the full suite of tests for all services to ensure system-wide integrity.
```powershell
# Run in each service directory
mvn test
```

## 2. Integration Testing (Docker)
The application is designed to run via Docker Compose.

### Status:
- **Containers**: Most containers seem to be running.
- **Action Required**: Since we fixed a bug in `muse-auth-service`, you should rebuild and restart it.

```powershell
docker-compose build muse-auth-service
docker-compose up -d muse-auth-service
```

## 3. API Testing
A Postman collection is available for the Notes service.
- **Location**: `services/muse-notes-service/muse-notes-service.postman_collection.json`
- **Action**: Import this into Postman to test the Notes API endpoints directly.

## 4. Frontend & End-to-End Walkthrough
The best way to verify the user experience is a manual walkthrough.

### Prerequisites:
- Ensure all backend services are running (Docker).
- Start the frontend:
  ```powershell
  cd frontend/web
  npm run dev
  ```

### Walkthrough Steps (based on Modernization Guide):
1.  **Login**: Navigate to `http://localhost:5173/login`. Test with valid/invalid credentials.
2.  **Notes Dashboard**: Check if notebooks and sections load.
3.  **Rich Editor**: Create a note, type some text, use the `/` command.
4.  **AI Features**: Try the "Explain" or "Summarize" buttons in the editor.

## 5. Known Issues Fixed
- **FollowController**: Fixed a compilation error where `JwtTokenProvider` was missing. Refactored to use `SecurityContextHolder`.

## 6. Calendar Module (Implemented)
- **Objective**: Create a centralized calendar to manage academic schedules and personal events.
- **Components**:
    - **Backend**: Created `muse-calendar-service` (Port 8088).
    - **Frontend**: Created `CalendarPage.jsx` using `react-big-calendar`.
- **Features**:
    - Create, update, delete personal events.
    - View events in Month/Week/Day/Agenda views.
    - Separate from Notes module as requested.


## 7. Phase 1 Features (New)
- **Bulk User Upload**:
    - **Objective**: Allow Admins to onboard students via CSV.
    - **Test**:
        1. Login as Admin.
        2. Go to Admin Dashboard.
        3. Click "Bulk Upload Users".
        4. Upload a CSV with `email,username,role`.
        5. Verify users are created in `muse-auth-service`.
- **AI Tutor (RAG)**:
    - **Objective**: Store embeddings for notes to enable context-aware AI.
    - **Test**:
        1. Create a new Note.
        2. Type some content.
        3. Verify in DB (`select * from notes`) that `embedding` column is populated (not null).
- **AI Chat (RAG)**:
    - **Objective**: Allow students to chat with their notes.
    - **Test**:
        1. Go to Notes Dashboard.
        2. Click the floating "Sparkles" icon (bottom right).
        3. Ask a question about one of your notes (e.g., "What did I write about React?").
        4. Verify the AI answers correctly and cites the source note.
