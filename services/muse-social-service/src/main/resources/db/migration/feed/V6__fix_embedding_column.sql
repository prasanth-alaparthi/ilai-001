-- V6__fix_embedding_column.sql
-- Fix the embedding column type to ensure it is vector(768)

-- Drop the column if it exists (to clear any bad type/data)
ALTER TABLE posts DROP COLUMN IF EXISTS embedding;

-- Re-add the column as vector(768)
ALTER TABLE posts ADD COLUMN embedding vector(768);

-- Re-create the index
CREATE INDEX IF NOT EXISTS idx_posts_embedding ON posts USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
