CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    criteria TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER,
    course_id BIGINT NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id),
    student_id VARCHAR(255) NOT NULL,
    content TEXT,
    submission_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE grades (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id),
    score INTEGER,
    feedback TEXT,
    grader_type VARCHAR(50),
    graded_date TIMESTAMP WITH TIME ZONE
);
