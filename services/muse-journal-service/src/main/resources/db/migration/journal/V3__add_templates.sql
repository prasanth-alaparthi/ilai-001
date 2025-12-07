-- V3__add_templates.sql

CREATE TABLE IF NOT EXISTS templates (
    id BIGSERIAL PRIMARY KEY,
    owner_username VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
