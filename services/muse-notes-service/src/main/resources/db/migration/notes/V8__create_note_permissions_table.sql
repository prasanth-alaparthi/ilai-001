-- V8__create_note_permissions_table.sql
-- Creates the note_permissions table for granular sharing

CREATE TABLE IF NOT EXISTS note_permissions (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    permission_level VARCHAR(50) NOT NULL,
    CONSTRAINT fk_note_permissions_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE (note_id, username)
);

CREATE INDEX IF NOT EXISTS idx_note_permissions_note_id ON note_permissions (note_id);
CREATE INDEX IF NOT EXISTS idx_note_permissions_username ON note_permissions (username);
