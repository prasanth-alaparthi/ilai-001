-- V4__add_mood_entries.sql

CREATE TABLE IF NOT EXISTS mood_entries (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT,
    username VARCHAR(255),
    mood VARCHAR(255),
    intensity INTEGER,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);
