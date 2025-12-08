-- V5__add_publications_submissions.sql

CREATE TABLE IF NOT EXISTS journal_publications (
    id BIGSERIAL PRIMARY KEY,
    entry_id BIGINT NOT NULL,
    submission_id BIGINT NOT NULL,
    course_code VARCHAR(255) NOT NULL,
    published_by_username VARCHAR(255) NOT NULL,
    published_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    tags VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS journal_submissions (
    id BIGSERIAL PRIMARY KEY,
    author_username VARCHAR(255) NOT NULL,
    entry_id BIGINT NOT NULL,
    course_code VARCHAR(255) NOT NULL,
    class_name VARCHAR(255),
    submitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL,
    reviewer_username VARCHAR(255),
    reviewer_comments TEXT,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE
);
