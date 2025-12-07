# AI Roadmap: Transforming Ilai into an AI-First EdTech Platform

To stand out in the crowded EdTech market, Ilai must move beyond "using AI" to being "AI-Native". This means AI shouldn't just be a feature; it should be the core engine driving learning.

Here is an assessment of your current state and a roadmap of 4 "Killer Features" that will make schools want to buy this immediately.

---

## Current State Assessment
- **Strengths**: You have a solid microservices foundation. You are already using Google Gemini for basic elaboration and content generation.
- **Weakness**: The AI is currently "Reactive" (it waits for the user to click "Elaborate").
- **Opportunity**: Make the AI "Proactive" (it suggests, guides, and tutors automatically).

---

## Feature 1: "Ilai Tutor" (The RAG Chatbot)
**The Concept**: A ChatGPT-like assistant that *knows* what the student is studying. It doesn't just answer questions; it answers them using the student's own notes and the school's textbooks.

**Why Schools Buy It**: "It's like giving every student a personal 1-on-1 tutor available 24/7."

**Technical Changes Required**:
1.  **Vector Database**: Enable `pgvector` extension in your PostgreSQL database.
2.  **Embeddings**: When a student saves a Note, automatically generate "embeddings" (numerical representations) using Gemini API and store them in the vector DB.
3.  **RAG Pipeline**: When a student asks a question, search their notes for relevant context, then send that context + the question to Gemini.

## Feature 2: "Smart Quiz Generator" (Active Recall)
**The Concept**: Instead of just reading notes, the AI automatically generates a 5-question quiz based on the note the student just wrote.

**Why Schools Buy It**: "Active Recall" is the #1 scientifically proven way to learn. Ilai automates this.

**Technical Changes Required**:
1.  **Trigger**: Add a listener in `muse-notes-service`. When a note is saved -> Trigger "Quiz Generation".
2.  **Prompt Engineering**: Send the note content to Gemini with a prompt: *"Generate 5 multiple-choice questions based on this text, with the correct answer hidden."*
3.  **UI**: Add a "Take Quiz" button on every note.

## Feature 3: "The Teacher's AI Assistant" (Auto-Grading)
**The Concept**: Teachers spend hours grading essays. Ilai AI can pre-grade assignments, highlighting grammar errors, checking for plagiarism (AI detection), and suggesting a grade based on a rubric.

**Why Schools Buy It**: It saves teachers 10+ hours a week.

**Technical Changes Required**:
1.  **New Service**: Create `muse-assignment-service`.
2.  **Teacher Interface**: Allow teachers to upload a "Rubric" (grading criteria).
3.  **Analysis**: When a student submits work, run it through Gemini with the Rubric to generate a feedback report.

## Feature 4: "Voice Notes & Socratic Mode"
**The Concept**: Many students learn by listening/speaking. Allow students to talk to Ilai.
- *Socratic Mode*: The AI never gives the answer. It asks questions back to guide the student to the answer (Critical Thinking).

**Technical Changes Required**:
1.  **Frontend**: Implement `Speech-to-Text` (Web Speech API is free).
2.  **Backend**: Adjust system prompts to "Socratic Mode" (e.g., *"You are a tutor. Never give the answer. Ask guiding questions."*).

---

## Implementation Plan (Step-by-Step)

### Phase 1: The Foundation (Vector Search)
1.  Update `docker-compose.yml` to use `pgvector/pgvector:pg16` image instead of standard postgres.
2.  Update `muse-notes-service` to generate embeddings for every note.

### Phase 2: The Tutor
1.  Build the Chat UI in the frontend (floating button).
2.  Create the `/api/ai/chat` endpoint that performs the RAG search.

### Phase 3: The Quiz
1.  Add a "Generate Quiz" button to the Note Editor.
2.  Store quizzes in a new `Quiz` table.

## Competitive Advantage
Most EdTech apps just wrap ChatGPT. By implementing **Feature 1 (RAG)**, you are offering something ChatGPT cannot do: **Personalized answers based on the school's specific curriculum.** That is your moat.
