-- V11__create_templates_table.sql
-- Creates the templates table for note templates

CREATE TABLE IF NOT EXISTS templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL
);
