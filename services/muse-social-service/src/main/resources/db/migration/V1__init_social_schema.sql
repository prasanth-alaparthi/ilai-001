-- ============================================================
-- V1: ILAI Social Service - Initial Schema
-- Features: BountyBoard, Reputation, Token Usage, Subscriptions
-- Phase 3 Ready: pgvector, HNSW indexes, auto-updated_at
-- ============================================================

-- ==================== EXTENSIONS ====================

-- Enable pgvector for Phase 3 Paper-Graph & Researcher Matchmaking
CREATE EXTENSION IF NOT EXISTS vector;

-- ==================== GENERIC TRIGGER FUNCTION ====================

-- Auto-update updated_at column on any table modification
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ==================== USER SUBSCRIPTIONS ====================

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    stripe_subscription_item_id VARCHAR(100),
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- Auto-update trigger
CREATE TRIGGER update_subscriptions_modtime 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==================== TOKEN USAGE (AI Billing) ====================

CREATE TABLE IF NOT EXISTS token_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    billing_period VARCHAR(7) NOT NULL,  -- YYYY-MM
    input_tokens BIGINT DEFAULT 0,
    output_tokens BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    request_count INT DEFAULT 0,
    synced_to_stripe BOOLEAN DEFAULT FALSE,
    stripe_usage_record_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_usage_user_period ON token_usage(user_id, billing_period);
CREATE UNIQUE INDEX idx_token_usage_unique ON token_usage(user_id, billing_period);

CREATE TRIGGER update_token_usage_modtime 
    BEFORE UPDATE ON token_usage 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==================== USER REPUTATION ====================

CREATE TABLE IF NOT EXISTS user_reputation (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_score INT DEFAULT 0,
    level INT DEFAULT 1,
    streak_days INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    bounties_created INT DEFAULT 0,
    bounties_solved INT DEFAULT 0,
    notes_shared INT DEFAULT 0,
    upvotes_received INT DEFAULT 0,
    upvotes_given INT DEFAULT 0,
    last_activity_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Phase 3: Researcher Matchmaking embedding (OpenAI ada-002 = 1536 dims)
    interest_embedding vector(1536)
);

CREATE INDEX idx_reputation_score ON user_reputation(total_score DESC);
CREATE INDEX idx_reputation_level ON user_reputation(level);

-- HNSW index for researcher matchmaking (Phase 3)
CREATE INDEX idx_reputation_embedding_hnsw ON user_reputation 
    USING hnsw (interest_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE TRIGGER update_reputation_modtime 
    BEFORE UPDATE ON user_reputation 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Reputation history for audit trail
CREATE TABLE IF NOT EXISTS reputation_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_change INT NOT NULL,
    reason VARCHAR(255),
    source_type VARCHAR(50),  -- bounty | post | upvote | streak | admin
    source_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized composite index for fast dashboard queries
CREATE INDEX idx_reputation_history_user ON reputation_history(user_id, created_at DESC);
CREATE INDEX idx_rep_history_composite ON reputation_history(user_id, source_type, created_at DESC);

-- ==================== BOUNTYBOARD ====================

CREATE TABLE IF NOT EXISTS bounties (
    id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL,
    linked_note_id BIGINT,  -- Reference to notes service
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(50),  -- math | physics | chemistry | cs | general
    difficulty VARCHAR(20) DEFAULT 'medium',  -- easy | medium | hard | expert
    reward_points INT NOT NULL DEFAULT 10,
    status VARCHAR(20) DEFAULT 'open',  -- open | claimed | solved | expired | canceled
    solver_id BIGINT,
    solution_note_id BIGINT,
    deadline TIMESTAMP,
    view_count INT DEFAULT 0,
    attempt_count INT DEFAULT 0,
    tags VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bounty_status ON bounties(status);
CREATE INDEX idx_bounty_subject ON bounties(subject, status);
CREATE INDEX idx_bounty_creator ON bounties(creator_id);
CREATE INDEX idx_bounty_solver ON bounties(solver_id);
CREATE INDEX idx_bounty_trending ON bounties(view_count DESC, reward_points DESC) 
    WHERE status = 'open';

CREATE TRIGGER update_bounties_modtime 
    BEFORE UPDATE ON bounties 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Bounty solution attempts
CREATE TABLE IF NOT EXISTS bounty_attempts (
    id BIGSERIAL PRIMARY KEY,
    bounty_id BIGINT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    solution_note_id BIGINT,
    explanation TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending | accepted | rejected
    reviewer_id BIGINT,
    review_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_attempt_bounty ON bounty_attempts(bounty_id);
CREATE INDEX idx_attempt_user ON bounty_attempts(user_id);

-- ==================== STUDY WAR ROOMS ====================

CREATE TABLE IF NOT EXISTS study_rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    description TEXT,
    creator_id BIGINT NOT NULL,
    max_participants INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    is_private BOOLEAN DEFAULT FALSE,
    access_code VARCHAR(20),  -- For private rooms
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_active ON study_rooms(is_active, subject);
CREATE INDEX idx_room_creator ON study_rooms(creator_id);

CREATE TRIGGER update_study_rooms_modtime 
    BEFORE UPDATE ON study_rooms 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Room participants
CREATE TABLE IF NOT EXISTS room_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) DEFAULT 'member',  -- owner | moderator | member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_participant_room ON room_participants(room_id);
CREATE INDEX idx_participant_user ON room_participants(user_id);

-- Room variables (with vector clock for CRDT sync)
CREATE TABLE IF NOT EXISTS room_variables (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    value TEXT NOT NULL,
    unit VARCHAR(20),
    precision_digits INT DEFAULT 6,
    vector_clock JSONB DEFAULT '{}',
    last_updated_by BIGINT,
    source VARCHAR(20) DEFAULT 'user',  -- user | solver | research
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, symbol)
);

CREATE INDEX idx_variable_room ON room_variables(room_id);

CREATE TRIGGER update_room_variables_modtime 
    BEFORE UPDATE ON room_variables 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Variable history for audit
CREATE TABLE IF NOT EXISTS room_variable_history (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_by BIGINT,
    vector_clock JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variable_history_room ON room_variable_history(room_id, symbol, created_at DESC);

-- ==================== HELPER FUNCTIONS ====================

-- Function to calculate user level from score
CREATE OR REPLACE FUNCTION calculate_level(score INT) RETURNS INT AS $$
BEGIN
    IF score < 100 THEN RETURN 1;
    ELSIF score < 300 THEN RETURN 2;
    ELSIF score < 600 THEN RETURN 3;
    ELSIF score < 1000 THEN RETURN 4;
    ELSIF score < 1500 THEN RETURN 5;
    ELSIF score < 2100 THEN RETURN 6;
    ELSIF score < 2800 THEN RETURN 7;
    ELSIF score < 3600 THEN RETURN 8;
    ELSIF score < 4500 THEN RETURN 9;
    ELSE RETURN 10;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update level when score changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := calculate_level(NEW.total_score);
    -- updated_at handled by generic trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_level
BEFORE UPDATE OF total_score ON user_reputation
FOR EACH ROW
EXECUTE FUNCTION update_user_level();

-- Trigger to expire bounties past deadline
CREATE OR REPLACE FUNCTION expire_old_bounties()
RETURNS void AS $$
BEGIN
    UPDATE bounties 
    SET status = 'expired'
    WHERE status = 'open' 
    AND deadline IS NOT NULL 
    AND deadline < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ==================== PHASE 3: RESEARCHER MATCHMAKING ====================

-- Find similar researchers based on activity embedding
CREATE OR REPLACE FUNCTION find_similar_researchers(
    query_embedding vector(1536),
    limit_count INT DEFAULT 10,
    min_level INT DEFAULT 1
)
RETURNS TABLE (
    user_id BIGINT,
    total_score INT,
    level INT,
    similarity FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set HNSW search parameter
    SET LOCAL hnsw.ef_search = 100;
    
    RETURN QUERY
    SELECT 
        ur.user_id,
        ur.total_score,
        ur.level,
        1 - (ur.interest_embedding <=> query_embedding) as similarity
    FROM user_reputation ur
    WHERE 
        ur.level >= min_level
        AND ur.interest_embedding IS NOT NULL
    ORDER BY ur.interest_embedding <=> query_embedding
    LIMIT limit_count;
END;
$$;

-- ==================== MAINTENANCE ====================

-- Analyze tables for query planner
ANALYZE user_subscriptions;
ANALYZE token_usage;
ANALYZE user_reputation;
ANALYZE reputation_history;
ANALYZE bounties;
ANALYZE bounty_attempts;
ANALYZE study_rooms;
ANALYZE room_variables;
