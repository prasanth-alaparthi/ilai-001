-- V15__fix_post_id_column_types.sql
-- Fix post_id column types from UUID to BIGINT to match posts.id

-- 1. Drop and recreate engagement_events (already fixed in V12, but ensure correct type)
DROP TABLE IF EXISTS engagement_events CASCADE;
CREATE TABLE IF NOT EXISTS engagement_events (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    post_id BIGINT NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    scroll_depth FLOAT DEFAULT 0,
    interaction_depth INT DEFAULT 0,
    session_id VARCHAR(100),
    device_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_post ON engagement_events(post_id);

-- 2. Fix saved_posts
DROP TABLE IF EXISTS saved_posts CASCADE;
CREATE TABLE IF NOT EXISTS saved_posts (
    user_id VARCHAR(255) NOT NULL,
    post_id BIGINT NOT NULL,
    collection_name VARCHAR(100) DEFAULT 'default',
    saved_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_posts(user_id);

-- 3. Fix post_notes
DROP TABLE IF EXISTS post_notes CASCADE;
CREATE TABLE IF NOT EXISTS post_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    post_id BIGINT NOT NULL,
    note_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_post_notes_user ON post_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_notes_post ON post_notes(post_id);

-- 4. Fix post_comments
DROP TABLE IF EXISTS post_comments CASCADE;
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id BIGINT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    parent_id UUID,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    is_best_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON post_comments(author_id);

-- 5. Fix post_shares
DROP TABLE IF EXISTS post_shares CASCADE;
CREATE TABLE IF NOT EXISTS post_shares (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    shared_by VARCHAR(255) NOT NULL,
    share_type VARCHAR(20) NOT NULL,
    target_conversation_id UUID,
    target_group_id UUID,
    repost_comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shares_post ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON post_shares(shared_by);
