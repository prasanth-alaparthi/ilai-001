-- V4__add_order_index.sql
-- Adds an order_index column to notebooks, sections, and notes for reordering

ALTER TABLE notebooks ADD COLUMN order_index INTEGER;
ALTER TABLE sections ADD COLUMN order_index INTEGER;
ALTER TABLE notes ADD COLUMN order_index INTEGER;
