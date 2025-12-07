-- V12__create_note_links_table.sql
-- Creates the note_links table for storing relationships between notes

CREATE TABLE IF NOT EXISTS note_links (
    source_note_id BIGINT NOT NULL,
    linked_note_id BIGINT NOT NULL,
    relevance_score REAL,
    PRIMARY KEY (source_note_id, linked_note_id),
    CONSTRAINT fk_note_links_source FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_links_linked FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_links_source_note_id ON note_links (source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_linked_note_id ON note_links (linked_note_id);
