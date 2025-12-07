-- File: auth-service/src/main/resources/db/migration/V2__profiles_module.sql
-- Flyway migration: profiles, follows, user_stats

CREATE TABLE IF NOT EXISTS profiles (
    user_id BIGINT PRIMARY KEY,
    display_name VARCHAR(120),
    bio TEXT,
    avatar_url VARCHAR(512),
    location VARCHAR(128),
    website VARCHAR(255),
    interests JSONB,
    privacy_profile VARCHAR(16) DEFAULT 'PUBLIC',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
    id BIGSERIAL PRIMARY KEY,
    follower_username VARCHAR(64) NOT NULL,
    followee_username VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT uk_follow_pair UNIQUE (follower_username, followee_username)
);
CREATE INDEX IF NOT EXISTS idx_follow_follower ON follows (follower_username);
CREATE INDEX IF NOT EXISTS idx_follow_followee ON follows (followee_username);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id BIGINT PRIMARY KEY,
    followers_count BIGINT NOT NULL DEFAULT 0,
    following_count BIGINT NOT NULL DEFAULT 0,
    posts_count BIGINT NOT NULL DEFAULT 0,
    library_count BIGINT NOT NULL DEFAULT 0
);

-- initialize user_stats for existing users, if users table exists
INSERT INTO user_stats (user_id, followers_count, following_count, posts_count, library_count)
SELECT u.id, 0, 0, 0, 0
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_stats us WHERE us.user_id = u.id);



CREATE TABLE IF NOT EXISTS collections (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL,
  name VARCHAR(255),
  description TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_items (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255),
description TEXT,
price BIGINT,
thumbnail TEXT,
meta_json JSONB,
created_at TIMESTAMP DEFAULT now(),
updated_at TIMESTAMP DEFAULT now()
);