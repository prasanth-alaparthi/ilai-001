-- V6__add_order_index.sql
-- Adds an order_index column to notebooks, sections, and notes for reordering

ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
