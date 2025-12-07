ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(32);
ALTER TABLE users ADD COLUMN is_student_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE institutions ADD COLUMN has_active_subscription BOOLEAN DEFAULT FALSE;
