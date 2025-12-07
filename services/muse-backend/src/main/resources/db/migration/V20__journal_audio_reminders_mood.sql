-- Journal audio attachments
CREATE TABLE IF NOT EXISTS journal_audio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_id BIGINT NOT NULL,
  username VARCHAR(255),
  filename VARCHAR(1024),
  filepath VARCHAR(2048),
  duration_seconds INT,
  transcription TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_journal_audio_journal ON journal_audio(journal_id);

-- Reminders
CREATE TABLE IF NOT EXISTS journal_reminders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_id BIGINT, -- optional: link to specific journal entry
  username VARCHAR(255) NOT NULL,
  remind_at TIMESTAMP NOT NULL,
  repeat_rule VARCHAR(64), -- none, daily, weekly
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_journal_remind_user ON journal_reminders(username);
CREATE INDEX IF NOT EXISTS idx_journal_remind_time ON journal_reminders(remind_at);

-- Mood entries
CREATE TABLE IF NOT EXISTS mood_entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_id BIGINT,
  username VARCHAR(255),
  mood VARCHAR(64), -- e.g., happy, sad, neutral, motivated, anxious
  intensity SMALLINT, -- 1..10
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON mood_entries(username);
CREATE INDEX IF NOT EXISTS idx_mood_entries_journal ON mood_entries(journal_id);

