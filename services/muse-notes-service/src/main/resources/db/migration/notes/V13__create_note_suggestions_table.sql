-- V13__create_note_suggestions_table.sql
-- Creates the note_suggestions table for AI-generated suggestions

CREATE TABLE IF NOT EXISTS note_suggestions (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL,
    type VARCHAR(255) NOT NULL,
    suggestion_content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_note_suggestions_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_suggestions_note_id ON note_suggestions (note_id);
