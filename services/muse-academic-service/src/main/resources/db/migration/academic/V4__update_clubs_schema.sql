-- V4: Update clubs schema and add club_posts table

-- Add new columns to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'ACADEMIC';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS creator_id BIGINT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Make patron_teacher_id nullable
ALTER TABLE clubs ALTER COLUMN patron_teacher_id DROP NOT NULL;
ALTER TABLE clubs ALTER COLUMN institution_id DROP NOT NULL;

-- Update club_members table
ALTER TABLE club_members RENAME COLUMN student_id TO user_id;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'MEMBER';

-- Create club_posts table
CREATE TABLE IF NOT EXISTS club_posts (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    is_pinned BOOLEAN DEFAULT false,
    is_announcement BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create index for club posts
CREATE INDEX IF NOT EXISTS idx_club_posts_club_id ON club_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_author_id ON club_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
