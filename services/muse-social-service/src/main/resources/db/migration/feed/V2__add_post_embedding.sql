-- V2__add_post_embedding.sql
-- Adds a vector column for semantic search on posts and an IVFFlat index

-- 1. Add the vector column to the posts table
-- The size of the vector (e.g., 768 for Gemini's embedding-001) is important.
ALTER TABLE posts ADD COLUMN embedding vector(768);

-- 2. Create an IVFFlat index for fast similarity search
-- This is a common index type for vector search. The number of lists is a trade-off
-- between build time and query speed. A good starting point is sqrt(number of rows).
-- We'll use a reasonable default for now.
CREATE INDEX ON posts USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
