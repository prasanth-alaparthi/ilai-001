-- Seed Achievements
-- V8: Initial achievement catalog

INSERT INTO achievements (code, name, description, icon, xp_reward, tier, category, requirement_type, requirement_count) VALUES
-- Notes Achievements
('first_note', 'First Steps', 'Create your first note', 'pencil', 50, 'bronze', 'notes', 'count', 1),
('notes_10', 'Note Taker', 'Create 10 notes', 'notebook', 100, 'bronze', 'notes', 'count', 10),
('notes_50', 'Prolific Writer', 'Create 50 notes', 'book', 250, 'silver', 'notes', 'count', 50),
('notes_100', 'Note Master', 'Create 100 notes', 'library', 500, 'gold', 'notes', 'count', 100),
('notes_500', 'Legendary Scribe', 'Create 500 notes', 'crown', 2000, 'platinum', 'notes', 'count', 500),

-- Study Achievements
('first_quiz', 'Quiz Starter', 'Complete your first quiz', 'brain', 50, 'bronze', 'study', 'count', 1),
('quiz_ace', 'Perfect Score', 'Score 100% on a quiz', 'trophy', 150, 'silver', 'study', 'special', 1),
('quizzes_10', 'Quiz Champion', 'Complete 10 quizzes', 'award', 200, 'silver', 'study', 'count', 10),
('flashcards_100', 'Memory Training', 'Review 100 flashcards', 'cards', 100, 'bronze', 'study', 'count', 100),
('flashcards_500', 'Memory Champion', 'Review 500 flashcards', 'zap', 300, 'silver', 'study', 'count', 500),
('flashcards_1000', 'Memory Master', 'Review 1000 flashcards', 'star', 750, 'gold', 'study', 'count', 1000),

-- Streak Achievements  
('streak_3', 'Getting Started', '3-day study streak', 'flame', 75, 'bronze', 'streak', 'streak', 3),
('streak_7', 'Week Warrior', '7-day study streak', 'fire', 200, 'silver', 'streak', 'streak', 7),
('streak_14', 'Fortnight Focus', '14-day study streak', 'target', 400, 'silver', 'streak', 'streak', 14),
('streak_30', 'Monthly Master', '30-day study streak', 'volcano', 1000, 'gold', 'streak', 'streak', 30),
('streak_100', 'Legendary Learner', '100-day study streak', 'gem', 5000, 'platinum', 'streak', 'streak', 100),
('streak_365', 'Year of Learning', '365-day study streak', 'crown', 25000, 'platinum', 'streak', 'streak', 365),

-- Study Time Achievements
('study_1hr', 'First Hour', 'Study for 1 hour total', 'clock', 50, 'bronze', 'study', 'count', 60),
('study_10hr', 'Dedicated Student', 'Study for 10 hours total', 'hourglass', 200, 'silver', 'study', 'count', 600),
('study_50hr', 'Focused Mind', 'Study for 50 hours total', 'timer', 500, 'gold', 'study', 'count', 3000),
('study_100hr', 'Study Master', 'Study for 100 hours total', 'graduation', 1500, 'platinum', 'study', 'count', 6000),

-- Special Achievements
('quantum_explorer', 'Quantum Explorer', 'Run your first quantum circuit', 'atom', 200, 'gold', 'special', 'special', 1),
('ai_chat_100', 'AI Learner', 'Have 100 AI conversations', 'sparkles', 150, 'silver', 'special', 'count', 100),
('mindmap_creator', 'Visual Thinker', 'Generate 10 mind maps', 'branching', 100, 'bronze', 'special', 'count', 10),
('audio_listener', 'Audio Learner', 'Listen to 10 audio overviews', 'headphones', 100, 'bronze', 'special', 'count', 10),

-- Social Achievements
('first_group', 'Team Player', 'Join your first study group', 'users', 50, 'bronze', 'social', 'count', 1),
('group_post', 'Contributor', 'Make 10 posts in study groups', 'message', 100, 'bronze', 'social', 'count', 10),

-- Level Milestones
('level_5', 'Rising Star', 'Reach Level 5', 'star', 100, 'bronze', 'special', 'special', 5),
('level_10', 'Dedicated Learner', 'Reach Level 10', 'stars', 250, 'silver', 'special', 'special', 10),
('level_25', 'Knowledge Seeker', 'Reach Level 25', 'rocket', 1000, 'gold', 'special', 'special', 25),
('level_50', 'ILAI Master', 'Reach Level 50', 'crown', 5000, 'platinum', 'special', 'special', 50);
