-- V9__create_note_versions_table.sql
-- Creates the note_versions table for storing note history

CREATE TABLE IF NOT EXISTS note_versions (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL,
    title VARCHAR(512) NOT NULL,
    content JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_note_versions_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions (note_id);
