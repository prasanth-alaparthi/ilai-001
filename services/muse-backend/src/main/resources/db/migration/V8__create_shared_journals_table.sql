-- V8__create_shared_journals_table.sql
CREATE TABLE shared_journals (
  token VARCHAR(64) PRIMARY KEY,
  journal_id BIGINT NOT NULL,
  owner_username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL
);
CREATE INDEX idx_shared_journal_journalid ON shared_journals(journal_id);