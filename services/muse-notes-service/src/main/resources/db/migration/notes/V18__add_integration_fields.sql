ALTER TABLE calendar_events 
ADD COLUMN status VARCHAR(50),
ADD COLUMN group_id VARCHAR(255),
ADD COLUMN source_id BIGINT,
ADD COLUMN source_type VARCHAR(50),
ADD COLUMN streak_count INTEGER;

CREATE INDEX idx_calendar_events_group_id ON calendar_events(group_id);
