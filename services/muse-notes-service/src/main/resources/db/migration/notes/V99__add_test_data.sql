-- V99__add_test_data.sql
-- Inserts a sample set of data for testing purposes for the user 'notesuser'.
-- This script is designed to be run after all other migrations.

-- Create Notebooks
-- We use INSERT ... ON CONFLICT DO NOTHING to make this script safely re-runnable.
INSERT INTO notebooks (id, owner_username, title, color, created_at, updated_at, order_index) VALUES
(1, 'notesuser', 'Computer Science', '#6366f1', NOW(), NOW(), 0),
(2, 'notesuser', 'Personal Journal', '#f16366', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

-- Create Sections
INSERT INTO sections (id, notebook_id, title, created_at, updated_at, order_index) VALUES
(1, 1, 'Microservices', NOW(), NOW(), 0),
(2, 1, 'Databases', NOW(), NOW(), 1),
(3, 2, 'January 2025', NOW(), NOW(), 0)
ON CONFLICT (id) DO NOTHING;

-- Create Notes
-- Note 1 (Pinned)
INSERT INTO notes (owner_username, section_id, title, content, is_pinned, created_at, updated_at, order_index) VALUES
('notesuser', 1, 'Introduction to Microservices', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Microservices are an architectural style that structures an application as a collection of services that are highly maintainable and testable, loosely coupled, independently deployable, and organized around business capabilities."}]}]}', true, NOW(), NOW(), 0);

-- Note 2
INSERT INTO notes (owner_username, section_id, title, content, is_pinned, created_at, updated_at, order_index) VALUES
('notesuser', 1, 'Service Discovery Patterns', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Service discovery is how services find each other on a network. Common patterns include client-side discovery and server-side discovery."}]}]}', false, NOW(), NOW(), 1);

-- Note 3
INSERT INTO notes (owner_username, section_id, title, content, is_pinned, created_at, updated_at, order_index) VALUES
('notesuser', 2, 'PostgreSQL vs. MongoDB', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"PostgreSQL is a powerful, open-source object-relational database system. MongoDB is a source-available cross-platform document-oriented database program."}]}]}', false, NOW(), NOW(), 0);

-- Note 4 (In the journal)
INSERT INTO notes (owner_username, section_id, title, content, is_pinned, created_at, updated_at, order_index) VALUES
('notesuser', 3, 'New Year''s Day Reflection', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"It was a quiet and peaceful day. A good start to the year."}]}]}', false, NOW(), NOW(), 0);

-- Manually advance the sequence generators if needed, so new inserts don't conflict with hardcoded IDs.
-- This is important if you run this script and then try to create new items via the API.
SELECT setval('notebooks_id_seq', (SELECT MAX(id) FROM notebooks));
SELECT setval('sections_id_seq', (SELECT MAX(id) FROM sections));
