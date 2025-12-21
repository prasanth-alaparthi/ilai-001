-- Migration V37: Add user_id to notes, notebooks, and sections for production alignment
-- This aligns entities with JournalEntry and other core systems

-- Notes Table
ALTER TABLE notes ADD COLUMN user_id BIGINT;
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Notebooks Table
ALTER TABLE notebooks ADD COLUMN user_id BIGINT;
CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);

-- Sections Table
ALTER TABLE sections ADD COLUMN user_id BIGINT;
CREATE INDEX idx_sections_user_id ON sections(user_id);

-- Note Permissions Table
ALTER TABLE note_permissions ADD COLUMN user_id BIGINT;
CREATE INDEX idx_note_permissions_user_id ON note_permissions(user_id);
