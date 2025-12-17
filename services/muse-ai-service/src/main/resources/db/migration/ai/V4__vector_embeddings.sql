-- V4: Vector Embeddings for RAG (Phase 3)
-- Enables semantic search with pgvector

-- Enable pgvector extension (requires PostgreSQL with pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Note embeddings table for semantic search
CREATE TABLE IF NOT EXISTS note_embeddings (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    chunk_index INT DEFAULT 0,           -- For long notes split into chunks
    chunk_text TEXT NOT NULL,            -- The text that was embedded
    embedding vector(768),               -- Gemini embedding dimension
    token_count INT,                     -- Number of tokens in chunk
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(note_id, chunk_index)
);

-- Conversation message embeddings for chat history search
CREATE TABLE IF NOT EXISTS message_embeddings (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(message_id)
);

-- Feed article embeddings for content search
CREATE TABLE IF NOT EXISTS article_embeddings (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL,
    title TEXT,
    summary_text TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(article_id)
);

-- Research cache for web search results
CREATE TABLE IF NOT EXISTS research_cache (
    id BIGSERIAL PRIMARY KEY,
    query_hash VARCHAR(64) NOT NULL,     -- SHA-256 of query
    query TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,    -- wikipedia, arxiv, duckduckgo, news
    results JSONB NOT NULL,              -- Cached search results
    expires_at TIMESTAMP NOT NULL,       -- TTL for cache
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(query_hash, source_type)
);

-- Create indexes for efficient similarity search
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_note_embeddings_vector 
    ON note_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_message_embeddings_vector 
    ON message_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_article_embeddings_vector 
    ON article_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Regular indexes for filtering
CREATE INDEX IF NOT EXISTS idx_note_embeddings_user 
    ON note_embeddings(user_id);

CREATE INDEX IF NOT EXISTS idx_note_embeddings_note 
    ON note_embeddings(note_id);

CREATE INDEX IF NOT EXISTS idx_message_embeddings_user 
    ON message_embeddings(user_id);

CREATE INDEX IF NOT EXISTS idx_message_embeddings_conversation 
    ON message_embeddings(conversation_id);

CREATE INDEX IF NOT EXISTS idx_research_cache_expires 
    ON research_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_research_cache_query 
    ON research_cache(query_hash, source_type);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM research_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
