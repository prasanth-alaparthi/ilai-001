-- V5: Create club_events table

CREATE TABLE IF NOT EXISTS club_events (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    event_type VARCHAR(50) DEFAULT 'MEETING',
    creator_id BIGINT NOT NULL,
    rsvp_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_club_events_club_id ON club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_date ON club_events(event_date);
