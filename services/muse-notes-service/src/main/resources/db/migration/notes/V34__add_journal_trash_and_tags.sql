-- Add trash and tags support to journal_entries
ALTER TABLE journal_entries ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE journal_entries ADD COLUMN tags TEXT[];

-- Create GIN index for fast tag searching
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN (tags);

-- Index for finding trashed items efficiently
CREATE INDEX idx_journal_entries_deleted_at ON journal_entries(deleted_at) WHERE deleted_at IS NOT NULL;
