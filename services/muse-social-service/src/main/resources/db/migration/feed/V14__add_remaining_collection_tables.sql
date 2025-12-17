-- V14__add_remaining_collection_tables.sql
-- Add remaining missing collection tables

-- Group subjects (ElementCollection for StudyGroup.subjects)
CREATE TABLE IF NOT EXISTS group_subjects (
    group_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    PRIMARY KEY (group_id, subject),
    CONSTRAINT fk_group_subjects_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
);

-- Post hashtags (ElementCollection for Post.hashtags)
CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id BIGINT NOT NULL,
    hashtag VARCHAR(100) NOT NULL,
    PRIMARY KEY (post_id, hashtag),
    CONSTRAINT fk_post_hashtags_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Post media URLs (ElementCollection for Post.mediaUrls)
CREATE TABLE IF NOT EXISTS post_media (
    post_id BIGINT NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    PRIMARY KEY (post_id, media_url),
    CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_subjects_group ON group_subjects(group_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);
