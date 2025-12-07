-- V1__init.sql
-- Initial migration for muse-journal-service

CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entry_date DATE NOT NULL,
    highlights TEXT,
    challenges TEXT,
    intentions TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_date ON journal_entries (user_id, entry_date);

CREATE TABLE IF NOT EXISTS moods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entry_date DATE NOT NULL,
    mood_type VARCHAR(255) NOT NULL,
    notes TEXT,
    UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_moods_user_id_date ON moods (user_id, entry_date);

CREATE TABLE IF NOT EXISTS gratitudes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entry_date DATE NOT NULL,
    content TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gratitudes_user_id_date ON gratitudes (user_id, entry_date);
