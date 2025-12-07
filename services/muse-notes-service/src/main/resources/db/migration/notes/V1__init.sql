-- V1__init.sql
-- Initial migration for muse-notes-service

CREATE TABLE IF NOT EXISTS notebooks (
    id BIGSERIAL PRIMARY KEY,
    owner_username VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notebooks_owner_username ON notebooks (owner_username);

CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    notebook_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_sections_notebook FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sections_notebook_id ON sections (notebook_id);

CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    owner_username VARCHAR(255) NOT NULL,
    section_id BIGINT NOT NULL,
    title VARCHAR(512) NOT NULL,
    content JSONB,
    author_name VARCHAR(255),
    excerpt VARCHAR(1024),
    summary TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_notes_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_owner_username ON notes (owner_username);
CREATE INDEX IF NOT EXISTS idx_notes_section_id ON notes (section_id);

CREATE TABLE IF NOT EXISTS shared_notes (
    token VARCHAR(255) PRIMARY KEY,
    note_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_shared_notes_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_notes_expires_at ON shared_notes (expires_at);
