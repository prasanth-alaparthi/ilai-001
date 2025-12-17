-- V3__create_user_interests_table.sql
-- Creates the user_interests table for tracking user preferences

CREATE TABLE IF NOT EXISTS user_interests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    interest_type VARCHAR(255) NOT NULL,
    interest_value TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    UNIQUE (user_id, interest_type, interest_value)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests (user_id);
