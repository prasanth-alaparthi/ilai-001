-- V13__add_missing_tables.sql
-- Add missing tables for schema validation

-- Group hashtags (ElementCollection for StudyGroup.hashtags)
CREATE TABLE IF NOT EXISTS group_hashtags (
    group_id UUID NOT NULL,
    hashtag VARCHAR(100) NOT NULL,
    PRIMARY KEY (group_id, hashtag),
    CONSTRAINT fk_group_hashtags_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_hashtags_group ON group_hashtags(group_id);
CREATE INDEX IF NOT EXISTS idx_group_hashtags_tag ON group_hashtags(hashtag);
