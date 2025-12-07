-- V5__create_attachments_table.sql
-- Creates the attachments table for storing file metadata

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY,
    owner_username VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_owner_username ON attachments (owner_username);
