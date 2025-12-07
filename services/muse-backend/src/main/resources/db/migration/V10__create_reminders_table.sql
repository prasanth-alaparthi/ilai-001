-- V10__create_reminders_table.sql
CREATE TABLE reminders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_id BIGINT,
  owner_username VARCHAR(255) NOT NULL,
  remind_at TIMESTAMP NOT NULL,
  message VARCHAR(1024),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fired BOOLEAN DEFAULT false
);
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);