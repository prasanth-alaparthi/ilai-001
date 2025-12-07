-- V21__journal_phase5.sql

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  note_id BIGINT NOT NULL,
  username VARCHAR(255),
  question TEXT,
  answer TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_flashcards_note ON flashcards(note_id);

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  note_id BIGINT NOT NULL,
  username VARCHAR(255),
  text_snippet TEXT NOT NULL,
  color VARCHAR(32) DEFAULT 'yellow',
  start_pos INT,
  end_pos INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_highlights_note ON highlights(note_id);

-- Share links (unlisted)
CREATE TABLE IF NOT EXISTS share_links (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  note_id BIGINT NOT NULL,
  token VARCHAR(128) NOT NULL UNIQUE,
  username VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_share_note ON share_links(note_id);

-- Daily prompts & responses
CREATE TABLE IF NOT EXISTS daily_prompts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prompt_responses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  prompt_id BIGINT NOT NULL,
  username VARCHAR(255),
  response TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_user ON prompt_responses(username);

-- Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  username VARCHAR(255) PRIMARY KEY,
  last_response_date DATE,
  streak_count INT DEFAULT 0
);

-- Add a simple GIN index for note full-text search (title + content)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE notes SET search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''));
CREATE INDEX IF NOT EXISTS idx_notes_search_vector ON notes USING GIN (search_vector);
-- Trigger to maintain search_vector on insert/update
CREATE OR REPLACE FUNCTION notes_tsvector_update() RETURNS trigger AS $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.title,'') || ' ' || coalesce(new.content,''));
  return new;
end
$$ LANGUAGE plpgsql;