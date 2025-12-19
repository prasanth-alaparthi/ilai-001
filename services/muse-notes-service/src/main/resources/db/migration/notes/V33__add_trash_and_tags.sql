-- Add deleted_at column for soft delete / trash feature
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add tags column for note tagging feature
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index for efficient trash queries
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create index for tag-based queries
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
