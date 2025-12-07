-- V2__add_audio_reminder_shared.sql

CREATE TABLE IF NOT EXISTS journal_audio (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT,
    username VARCHAR(255),
    filename VARCHAR(255),
    filepath VARCHAR(255),
    audio_url VARCHAR(255),
    duration_seconds INTEGER,
    transcription TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS journal_reminders (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT,
    username VARCHAR(255),
    remind_at TIMESTAMP WITHOUT TIME ZONE,
    repeat_rule VARCHAR(255),
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS journal_transcripts (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT NOT NULL,
    transcript TEXT,
    provider VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS shared_journals (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    journal_id BIGINT NOT NULL,
    owner_username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE
);
