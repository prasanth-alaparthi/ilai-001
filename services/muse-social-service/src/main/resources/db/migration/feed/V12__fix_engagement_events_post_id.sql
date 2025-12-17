-- V12__fix_engagement_events_post_id.sql
-- Fix post_id column type to match posts.id (BIGINT instead of UUID)

-- Drop existing engagement_events table and recreate with correct type
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
CREATE INDEX IF NOT EXISTS idx_engagement_time ON engagement_events(created_at DESC);
