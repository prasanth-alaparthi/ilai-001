-- V7__add_is_pinned_to_notes.sql
-- Adds an is_pinned column to the notes table

ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
