-- Add parent_id column to sections table for nested folders/chapters
ALTER TABLE sections ADD COLUMN IF NOT EXISTS parent_id BIGINT;

-- Add foreign key constraint (self-referencing)
ALTER TABLE sections 
    ADD CONSTRAINT fk_section_parent 
    FOREIGN KEY (parent_id) 
    REFERENCES sections(id) 
    ON DELETE CASCADE;

-- Create index for efficient parent lookups
CREATE INDEX IF NOT EXISTS idx_sections_parent_id ON sections(parent_id);

-- Comment for documentation
COMMENT ON COLUMN sections.parent_id IS 'Self-referencing parent section ID for nested folder structure. NULL means root section.';
