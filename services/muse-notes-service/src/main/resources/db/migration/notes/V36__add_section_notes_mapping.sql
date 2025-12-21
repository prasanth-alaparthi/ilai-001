-- V36__add_section_notes_mapping.sql
-- Implements many-to-many relationship between sections and notes
-- This allows a shared note to appear in a "Shared Notes" folder without moving from its original section.

CREATE TABLE IF NOT EXISTS section_notes_mapping (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT NOT NULL,
    note_id BIGINT NOT NULL,
    metadata JSONB, -- For transient variable state during sharing (requested)
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mapping_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_mapping_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT uq_section_note UNIQUE (section_id, note_id)
);

CREATE INDEX IF NOT EXISTS idx_mapping_section_id ON section_notes_mapping (section_id);
CREATE INDEX IF NOT EXISTS idx_mapping_note_id ON section_notes_mapping (note_id);

COMMENT ON TABLE section_notes_mapping IS 'Links notes to folders (sections) in a many-to-many fashion for D2F sharing.';
