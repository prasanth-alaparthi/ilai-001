-- V14__create_note_calendar_links_table.sql
-- Creates the note_calendar_links table for linking notes to external calendar events

CREATE TABLE IF NOT EXISTS note_calendar_links (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL,
    calendar_event_id VARCHAR(255) NOT NULL,
    calendar_provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_note_calendar_links_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE (note_id, calendar_event_id, calendar_provider)
);

CREATE INDEX IF NOT EXISTS idx_note_calendar_links_note_id ON note_calendar_links (note_id);
