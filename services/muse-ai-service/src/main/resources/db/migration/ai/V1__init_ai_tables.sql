-- V1__init_ai_tables.sql
-- AI Service Database Schema

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    context_type VARCHAR(50), -- 'notes', 'feed', 'classroom', 'general'
    context_id VARCHAR(255), -- ID of related note/feed/assignment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user ON conversations(user_id);

-- Messages in conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    tool_calls JSONB, -- For function calling
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Agent executions
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'research', 'notes', 'quiz', 'schedule', 'custom'
    goal TEXT NOT NULL,
    tools TEXT[], -- Array of tool names this agent can use
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);

-- Tool calls made by agents
CREATE TABLE tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    input JSONB,
    output JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    error_message TEXT,
    duration_ms INTEGER,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tool_calls_agent ON tool_calls(agent_id);

-- User preferences and behavior tracking
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    learning_style VARCHAR(20), -- 'visual', 'auditory', 'kinesthetic', 'reading'
    study_preferences JSONB DEFAULT '{}',
    topic_interests JSONB DEFAULT '{}', -- {"physics": 85, "math": 60}
    skill_levels JSONB DEFAULT '{}', -- {"algebra": 0.8, "calculus": 0.4}
    recent_topics TEXT[],
    module_usage JSONB DEFAULT '{}', -- {"notes": 150, "feed": 80}
    ai_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- Background jobs queue
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'generate_embeddings', 'send_reminder', 'summarize'
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status_priority ON jobs(status, priority, scheduled_at);

-- Event log for cross-service events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'note.created', 'feed.saved', 'quiz.completed'
    source_service VARCHAR(50) NOT NULL,
    user_id BIGINT,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_type_processed ON events(event_type, processed);
CREATE INDEX idx_events_user ON events(user_id);
