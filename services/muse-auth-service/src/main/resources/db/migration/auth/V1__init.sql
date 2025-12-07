CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    university_id BIGINT,
    email_verified BOOLEAN NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    last_login_at TIMESTAMP WITHOUT TIME ZONE,
    last_password_change_at TIMESTAMP WITHOUT TIME ZONE,
    failed_login_attempts INTEGER NOT NULL,
    locked_until TIMESTAMP WITHOUT TIME ZONE,
    date_of_birth DATE,
    verification_status VARCHAR(32),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

CREATE TABLE IF NOT EXISTS profiles (
    id BIGINT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    bio VARCHAR(255),
    profile_picture_url VARCHAR(255),
    CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(2048) NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL,
    CONSTRAINT uk_refresh_tokens_token UNIQUE (token)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verif_token_value ON verification_tokens (token);
CREATE INDEX IF NOT EXISTS idx_verif_token_user ON verification_tokens (user_id);

CREATE TABLE IF NOT EXISTS user_guardians (
    child_id BIGINT NOT NULL,
    parent_id BIGINT NOT NULL,
    PRIMARY KEY (child_id, parent_id),
    CONSTRAINT fk_user_guardians_child FOREIGN KEY (child_id) REFERENCES users(id),
    CONSTRAINT fk_user_guardians_parent FOREIGN KEY (parent_id) REFERENCES users(id)
);
