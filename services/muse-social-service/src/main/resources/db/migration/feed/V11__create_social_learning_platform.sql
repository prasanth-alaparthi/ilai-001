-- V11__create_social_learning_platform.sql
-- Complete schema for ILAI Social Learning Platform
-- Modules: NeuroFeed, Socials, Groups, Profiles, Comments, Save/Notes

---------------------------------------------
-- MODULE 1: FEED POSTS (Enhanced)
---------------------------------------------
-- Drop and recreate posts table if needed to support all features
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS hashtags VARCHAR(100)[];
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'PUBLIC';
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS content_type VARCHAR(30) DEFAULT 'INSIGHT';
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS estimated_read_seconds INT DEFAULT 60;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS save_count INT DEFAULT 0;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 0;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS author_credentials VARCHAR(255);

-- Create GIN index for hashtag search if not exists
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_group ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(trending_score DESC);

---------------------------------------------
-- MODULE 2: INTEREST TRACKING (NeuroFeed)
---------------------------------------------
CREATE TABLE IF NOT EXISTS user_interest_dna (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    hashtag VARCHAR(100) NOT NULL,
    
    -- Core scores
    interest_score FLOAT DEFAULT 0,
    learning_velocity FLOAT DEFAULT 0,
    momentum FLOAT DEFAULT 1.0,
    
    -- Engagement counts
    total_views INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_saves INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    
    -- Learning level
    current_level VARCHAR(20) DEFAULT 'BEGINNER',
    
    -- Timestamps
    first_interaction TIMESTAMP DEFAULT NOW(),
    last_interaction TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, hashtag)
);

CREATE INDEX IF NOT EXISTS idx_user_interest_user ON user_interest_dna(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interest_score ON user_interest_dna(interest_score DESC);

-- Engagement events (raw tracking)
CREATE TABLE IF NOT EXISTS engagement_events (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    post_id UUID NOT NULL,
    
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

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    posts_viewed INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    avg_time_per_post FLOAT DEFAULT 0,
    
    session_mode VARCHAR(20) DEFAULT 'BROWSING',
    
    likes_given INT DEFAULT 0,
    saves_given INT DEFAULT 0,
    comments_made INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

-- Trending hashtags
CREATE TABLE IF NOT EXISTS trending_hashtags (
    hashtag VARCHAR(100) PRIMARY KEY,
    post_count_24h INT DEFAULT 0,
    engagement_24h INT DEFAULT 0,
    unique_users_24h INT DEFAULT 0,
    trending_score FLOAT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------------
-- MODULE 3: SAVE + NOTES
---------------------------------------------
CREATE TABLE IF NOT EXISTS saved_posts (
    user_id VARCHAR(255) NOT NULL,
    post_id UUID NOT NULL,
    collection_name VARCHAR(100) DEFAULT 'default',
    saved_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_posts(user_id);

CREATE TABLE IF NOT EXISTS post_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    post_id UUID NOT NULL,
    note_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_notes_user ON post_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_notes_post ON post_notes(post_id);

CREATE TABLE IF NOT EXISTS save_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    cover_image_url VARCHAR(500),
    is_private BOOLEAN DEFAULT TRUE,
    post_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------------
-- MODULE 4: SOCIAL GRAPH
---------------------------------------------
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id VARCHAR(255) NOT NULL,
    following_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);

CREATE TABLE IF NOT EXISTS friend_requests (
    id BIGSERIAL PRIMARY KEY,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    message VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_friend_req_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_req_from ON friend_requests(from_user_id);

CREATE TABLE IF NOT EXISTS friends (
    user_id VARCHAR(255) NOT NULL,
    friend_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);

CREATE TABLE IF NOT EXISTS blocked_users (
    blocker_id VARCHAR(255) NOT NULL,
    blocked_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

---------------------------------------------
-- MODULE 5: STUDY GROUPS (LinkedIn-style)
---------------------------------------------
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    hashtags VARCHAR(100)[],
    
    -- Settings
    visibility VARCHAR(20) DEFAULT 'PUBLIC',
    join_approval VARCHAR(20) DEFAULT 'AUTO',
    post_approval VARCHAR(20) DEFAULT 'AUTO',
    
    -- Context
    group_type VARCHAR(30) DEFAULT 'TOPIC',
    education_level VARCHAR(50),
    subjects TEXT[],
    
    -- Stats
    member_count INT DEFAULT 0,
    post_count INT DEFAULT 0,
    
    -- Admin
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_type ON study_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON study_groups(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_hashtags ON study_groups USING GIN(hashtags);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

CREATE TABLE IF NOT EXISTS group_join_requests (
    id BIGSERIAL PRIMARY KEY,
    group_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    message VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    responded_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS group_invites (
    id BIGSERIAL PRIMARY KEY,
    group_id UUID NOT NULL,
    invited_by VARCHAR(255) NOT NULL,
    invited_user VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------------
-- MODULE 6: USER PROFILES
---------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    
    -- Display
    display_name VARCHAR(100),
    bio VARCHAR(500),
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    
    -- Credentials
    credentials VARCHAR(255),
    institution VARCHAR(255),
    education_level VARCHAR(50),
    graduation_year INT,
    subjects TEXT[],
    
    -- Stats
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    friend_count INT DEFAULT 0,
    post_count INT DEFAULT 0,
    
    -- Settings
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    show_online_status BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

---------------------------------------------
-- MODULE 7: COMMENTS
---------------------------------------------
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
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

CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

---------------------------------------------
-- MODULE 8: MEDIA TRACKING
---------------------------------------------
CREATE TABLE IF NOT EXISTS media_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    
    -- Media info
    original_filename VARCHAR(255),
    media_type VARCHAR(20) NOT NULL,  -- IMAGE, VIDEO
    file_size_bytes BIGINT,
    
    -- Cloudinary info
    cloudinary_public_id VARCHAR(255),
    cloudinary_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    
    -- Context
    usage_type VARCHAR(30),  -- POST, CHAT, PROFILE, GROUP_COVER
    reference_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_user ON media_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_media_reference ON media_uploads(reference_id);

---------------------------------------------
-- MODULE 9: SHARE POSTS
---------------------------------------------
CREATE TABLE IF NOT EXISTS post_shares (
    id BIGSERIAL PRIMARY KEY,
    post_id UUID NOT NULL,
    shared_by VARCHAR(255) NOT NULL,
    
    -- Share target
    share_type VARCHAR(20) NOT NULL,  -- CHAT, GROUP, REPOST, EXTERNAL
    target_conversation_id UUID,      -- If shared to chat
    target_group_id UUID,             -- If shared to group
    
    -- Repost content
    repost_comment TEXT,              -- User's comment on repost
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_post ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON post_shares(shared_by);

---------------------------------------------
-- DONE
---------------------------------------------
