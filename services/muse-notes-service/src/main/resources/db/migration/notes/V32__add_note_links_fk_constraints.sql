-- Add foreign key constraints to note_links table for data integrity
-- This ensures orphaned links are automatically deleted when notes are removed

-- First, clean up any existing orphaned links
DELETE FROM note_links WHERE source_note_id NOT IN (SELECT id FROM notes);
DELETE FROM note_links WHERE linked_note_id NOT IN (SELECT id FROM notes);

-- Add FK constraints with CASCADE DELETE (if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_note_links_source') THEN
        ALTER TABLE note_links 
        ADD CONSTRAINT fk_note_links_source 
        FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_note_links_linked') THEN
        ALTER TABLE note_links 
        ADD CONSTRAINT fk_note_links_linked 
        FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE CASCADE;
    END IF;
END $$;
