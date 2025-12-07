ALTER TABLE conversations ADD COLUMN last_message_id UUID;

CREATE TABLE conversation_unread_counts (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    unread_count INTEGER DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);
