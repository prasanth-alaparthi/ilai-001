-- V6__create_journal_audio_table.sql
CREATE TABLE journal_audio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_id BIGINT NOT NULL,
  audio_url VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_journal_audio_journalid ON journal_audio(journal_id);