-- V5: Activity Tracking for Personalization (Phase 4)
-- Tracks user study sessions and engagement for AI recommendations

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_type VARCHAR(50) NOT NULL,      -- 'notes', 'flashcard', 'quiz', 'research', 'feed'
    topic VARCHAR(255),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_minutes INT,
    engagement_score DOUBLE PRECISION,       -- 0.0 to 1.0
    metadata JSONB DEFAULT '{}',            -- Additional session data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz performance tracking
CREATE TABLE IF NOT EXISTS quiz_performance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    quiz_id BIGINT,
    topic VARCHAR(255) NOT NULL,
    questions_total INT NOT NULL,
    questions_correct INT NOT NULL,
    score_percentage DOUBLE PRECISION NOT NULL,
    time_spent_seconds INT,
    difficulty_level VARCHAR(20),            -- 'easy', 'medium', 'hard'
    weak_areas JSONB DEFAULT '[]',           -- Topics where user struggled
    created_at TIMESTAMP DEFAULT NOW()
);

-- Topic mastery tracking
CREATE TABLE IF NOT EXISTS topic_mastery (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    mastery_level DOUBLE PRECISION DEFAULT 0.0, -- 0.0 to 1.0
    exposure_count INT DEFAULT 0,
    last_studied_at TIMESTAMP,
    avg_quiz_score DOUBLE PRECISION,
    retention_rate DOUBLE PRECISION,          -- Based on FSRS data
    confidence_level VARCHAR(20),             -- 'low', 'medium', 'high'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, topic)
);

-- Daily engagement metrics
CREATE TABLE IF NOT EXISTS daily_engagement (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    total_study_minutes INT DEFAULT 0,
    sessions_count INT DEFAULT 0,
    notes_viewed INT DEFAULT 0,
    notes_created INT DEFAULT 0,
    flashcards_reviewed INT DEFAULT 0,
    quizzes_taken INT DEFAULT 0,
    articles_read INT DEFAULT 0,
    ai_interactions INT DEFAULT 0,
    engagement_score DOUBLE PRECISION,
    streak_days INT DEFAULT 0,
    
    UNIQUE(user_id, date)
);

-- AI-generated study plans
CREATE TABLE IF NOT EXISTS study_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_name VARCHAR(255),
    plan_type VARCHAR(50) NOT NULL,          -- 'daily', 'weekly', 'topic', 'exam_prep'
    target_topic VARCHAR(255),
    goals JSONB NOT NULL,                    -- List of goals
    schedule JSONB NOT NULL,                  -- Day-by-day schedule
    progress JSONB DEFAULT '{}',              -- Progress tracking
    is_active BOOLEAN DEFAULT true,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations log
CREATE TABLE IF NOT EXISTS recommendations_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'topic', 'content', 'study_tip', 'schedule'
    content JSONB NOT NULL,
    source VARCHAR(50) NOT NULL,              -- 'rule_based', 'ai_generated'
    was_accepted BOOLEAN,
    feedback VARCHAR(20),                     -- 'helpful', 'not_helpful', 'dismissed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_quiz_performance_user ON quiz_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_performance_topic ON quiz_performance(topic);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_engagement_user_date ON daily_engagement(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_log_user ON recommendations_log(user_id);
