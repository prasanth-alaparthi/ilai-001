CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    rating DOUBLE PRECISION NOT NULL,
    comment VARCHAR(1000),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX idx_reviews_institution ON reviews(institution_id);
