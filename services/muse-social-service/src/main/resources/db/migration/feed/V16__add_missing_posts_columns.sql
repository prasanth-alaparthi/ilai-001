-- V16__add_missing_posts_columns.sql
-- Add missing columns to posts table

-- Add author info columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar VARCHAR(500);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_credentials VARCHAR(255);

-- Add group context
ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id UUID;

-- Add visibility and content classification
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'PUBLIC';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_type VARCHAR(30) DEFAULT 'INSIGHT';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS estimated_read_seconds INT DEFAULT 60;

-- Add engagement counters
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS save_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;

-- Add algorithm scores
ALTER TABLE posts ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 0.0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0.0;

-- Add vector embedding column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add source URL
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_group ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_quality ON posts(quality_score DESC);
