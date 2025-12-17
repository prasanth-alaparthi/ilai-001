-- Create share_permissions table for user-based sharing
CREATE TABLE IF NOT EXISTS share_permissions (
    id BIGSERIAL PRIMARY KEY,
    resource_type VARCHAR(20) NOT NULL,
    resource_id BIGINT NOT NULL,
    owner_username VARCHAR(255) NOT NULL,
    shared_with_username VARCHAR(255) NOT NULL,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    message VARCHAR(500),
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint: only one share per resource per user
    CONSTRAINT unique_share UNIQUE (resource_type, resource_id, shared_with_username)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_share_owner ON share_permissions(owner_username);
CREATE INDEX IF NOT EXISTS idx_share_target ON share_permissions(shared_with_username);
CREATE INDEX IF NOT EXISTS idx_share_resource ON share_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_share_pending ON share_permissions(shared_with_username, accepted) WHERE accepted = FALSE;

-- Comments for documentation
COMMENT ON TABLE share_permissions IS 'User-based sharing for notebooks, sections, and notes';
COMMENT ON COLUMN share_permissions.resource_type IS 'NOTEBOOK, SECTION, or NOTE';
COMMENT ON COLUMN share_permissions.permission_level IS 'VIEWER, COMMENTER, EDITOR, or OWNER';
