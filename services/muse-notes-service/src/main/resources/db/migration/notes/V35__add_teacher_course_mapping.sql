CREATE TABLE teacher_course_mappings (
    id BIGSERIAL PRIMARY KEY,
    teacher_username VARCHAR(255) NOT NULL,
    course_code VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_username, course_code)
);

CREATE INDEX idx_teacher_course ON teacher_course_mappings(teacher_username, course_code);
