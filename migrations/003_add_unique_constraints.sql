-- Migration 003: Add UNIQUE constraints to prevent duplicate promotions
-- Apply to Supabase SQL Editor

-- NOTE: Run this ONLY after verifying no duplicate data exists.
-- Check for duplicates first:
--
--   SELECT class_id, month, COUNT(*) FROM promotions
--   GROUP BY class_id, month HAVING COUNT(*) > 1;
--
--   SELECT student_id, month, COUNT(*) FROM student_promotions
--   GROUP BY student_id, month HAVING COUNT(*) > 1;

-- Ensure each class has at most one promotion per month
ALTER TABLE promotions ADD CONSTRAINT uq_promotions_class_month
  UNIQUE (class_id, month);

-- Ensure each student has at most one individual promotion per month
ALTER TABLE student_promotions ADD CONSTRAINT uq_student_promotions_student_month
  UNIQUE (student_id, month);
