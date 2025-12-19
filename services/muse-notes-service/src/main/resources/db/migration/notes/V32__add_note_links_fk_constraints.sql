-- Add foreign key constraints to note_links table for data integrity
-- This ensures orphaned links are automatically deleted when notes are removed

-- First, clean up any existing orphaned links
DELETE FROM note_links WHERE source_note_id NOT IN (SELECT id FROM notes);
DELETE FROM note_links WHERE linked_note_id NOT IN (SELECT id FROM notes);

-- Add FK constraints with CASCADE DELETE
ALTER TABLE note_links 
ADD CONSTRAINT fk_note_links_source 
FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE;

ALTER TABLE note_links 
ADD CONSTRAINT fk_note_links_linked 
FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE CASCADE;
