-- V6__update_journal_entries.sql
-- Add fields for rich text journal and remove unique constraint on date

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS content_json TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50),
ADD COLUMN IF NOT EXISTS course_code VARCHAR(100);

-- Drop the unique constraint to allow multiple entries per day
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_entry_date_key;
