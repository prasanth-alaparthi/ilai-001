-- V16__fix_embedding_column.sql
-- Fix the embedding column type to ensure it is vector(768)

-- Drop the column if it exists (to clear any bad type/data)
ALTER TABLE notes DROP COLUMN IF EXISTS embedding;

-- Re-add the column as vector(768)
ALTER TABLE notes ADD COLUMN embedding vector(768);

-- Re-create the index
CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
