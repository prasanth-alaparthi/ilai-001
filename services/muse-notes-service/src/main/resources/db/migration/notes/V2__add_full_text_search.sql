-- V2__add_full_text_search.sql
-- Adds full-text search capabilities to the notes table

-- 1. Add the tsvector column to store the searchable text
ALTER TABLE notes ADD COLUMN content_tsvector tsvector;

-- 2. Create a function to update the tsvector column from the title and content
CREATE OR REPLACE FUNCTION update_note_tsvector()
RETURNS TRIGGER AS $$
BEGIN
    -- Combine title and the text content from the JSONB field
    -- This assumes a simple JSON structure like {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}
    -- A more robust solution might require a more complex JSON parsing function
    NEW.content_tsvector :=
        setweight(to_tsvector('english', NEW.title), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content::text, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to automatically call the function on insert or update
CREATE TRIGGER notes_tsvector_update
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION update_note_tsvector();

-- 4. Create a GIN index for fast full-text search
CREATE INDEX notes_content_tsvector_idx ON notes USING GIN (content_tsvector);
