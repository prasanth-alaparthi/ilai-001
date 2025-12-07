ALTER TABLE posts ADD COLUMN media_type VARCHAR(32);

CREATE TABLE post_media (
    post_id BIGINT NOT NULL,
    media_url TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
