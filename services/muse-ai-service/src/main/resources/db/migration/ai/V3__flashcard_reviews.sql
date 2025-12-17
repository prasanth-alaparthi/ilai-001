-- V3__flashcard_reviews.sql
-- FSRS (Free Spaced Repetition Scheduler) tables for free mode

-- Flashcard review tracking for FSRS algorithm
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id BIGSERIAL PRIMARY KEY,
    flashcard_id UUID NOT NULL,
    user_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
    review_date DATE NOT NULL,
    next_review_date DATE NOT NULL,
    interval INTEGER NOT NULL,
    stability DOUBLE PRECISION NOT NULL,
    difficulty DOUBLE PRECISION NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding user's due cards
CREATE INDEX IF NOT EXISTS idx_flashcard_user 
    ON flashcard_reviews(flashcard_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_next_review 
    ON flashcard_reviews(user_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_user_reviews 
    ON flashcard_reviews(user_id, review_date DESC);

-- Flashcards table (if not exists in another service)
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    note_id UUID,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user 
    ON flashcards(user_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_note 
    ON flashcards(note_id);

-- Study sessions tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    cards_reviewed INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    cards_incorrect INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    session_type VARCHAR(50) DEFAULT 'review' -- review, learn, cram
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user 
    ON study_sessions(user_id, started_at DESC);
