-- V11__embeddings_and_ai_jobs.sql

-- If you use pgvector, this creates a vector column
-- NOTE: make sure pgvector extension exists on DB first
-- create extension if you can (requires superuser):
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  source_table VARCHAR(64) NOT NULL,   -- e.g. 'journals' or 'notes'
  source_id BIGINT NOT NULL,
  model VARCHAR(128),
  vector vector(1536),                  -- size depends on embedding model; 1536 is OpenAI text-embedding-3-small default size — adjust if you use different model
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source_table, source_id);
-- vector index for pgvector (approx kNN)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (vector) WITH (lists = 100);

CREATE TABLE ai_jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type VARCHAR(64) NOT NULL,            -- 'embedding' | 'summary'
  source_table VARCHAR(64),
  source_id BIGINT,
  payload JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'queued', -- queued | running | success | failed
  result JSONB,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);