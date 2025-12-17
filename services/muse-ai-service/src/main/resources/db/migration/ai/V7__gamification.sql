-- ILAI Gamification System
-- V7: XP, Levels, Streaks, Achievements, Study Sessions

-- User Gamification Stats
CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT UNIQUE NOT NULL,
    total_xp BIGINT DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_study_minutes INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements Catalog
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    xp_reward INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    category VARCHAR(50), -- notes, study, social, streak, special
    requirement_type VARCHAR(50), -- count, streak, special
    requirement_count INTEGER DEFAULT 1,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Earned Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id),
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- XP Transaction History
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    xp_amount INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- NOTE: study_sessions table already exists from V5 (activity_tracking)
-- We add the 'completed' column for gamification tracking
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Daily Activity Log (for streak calculation)
CREATE TABLE IF NOT EXISTS daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    activity_date DATE NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    study_minutes INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    UNIQUE(user_id, activity_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON user_gamification(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_xp ON user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_date ON xp_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user ON daily_activity(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
