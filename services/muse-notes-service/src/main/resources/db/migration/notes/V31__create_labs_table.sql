-- V31__create_labs_table.sql
-- Creates labs, quizzes, and quiz_questions tables for virtual labs

-- Labs table
CREATE TABLE IF NOT EXISTS labs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    subject VARCHAR(100),
    difficulty VARCHAR(50),
    content TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id BIGSERIAL PRIMARY KEY,
    lab_id BIGINT UNIQUE REFERENCES labs(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'MULTIPLE_CHOICE',
    options TEXT, -- JSON array of options
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_labs_category ON labs(category);
CREATE INDEX IF NOT EXISTS idx_labs_subject ON labs(subject);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
