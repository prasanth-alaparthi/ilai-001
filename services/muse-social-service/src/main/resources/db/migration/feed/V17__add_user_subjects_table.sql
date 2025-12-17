-- V17__add_user_subjects_table.sql
-- Add missing user_subjects collection table for FeedUserProfile

CREATE TABLE IF NOT EXISTS user_subjects (
    user_id VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON user_subjects(user_id);
