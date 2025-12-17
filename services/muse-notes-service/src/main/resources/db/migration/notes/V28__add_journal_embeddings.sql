-- V28__add_journal_embeddings.sql
-- Add embedding column for semantic search on journal entries

-- Add embedding column to journal_entries table
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_journal_entries_embedding ON journal_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add embedding column to gratitudes table for searching gratitude entries
ALTER TABLE gratitudes ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for gratitudes
CREATE INDEX IF NOT EXISTS idx_gratitudes_embedding ON gratitudes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
