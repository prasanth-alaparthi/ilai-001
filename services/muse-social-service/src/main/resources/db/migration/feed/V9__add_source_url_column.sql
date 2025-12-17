-- V9__add_source_url_column.sql
-- Adds source_url column to posts table

ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url TEXT;
