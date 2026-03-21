-- Migration 004: Add updated_at column and auto-update triggers
-- Apply to Supabase SQL Editor

-- Helper function to auto-set updated_at on row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add updated_at to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add updated_at to fees
ALTER TABLE fees ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE TRIGGER trg_fees_updated_at
  BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Note: extra_attendance already has updated_at managed at app level.
-- Optionally add trigger here too for consistency:
CREATE OR REPLACE TRIGGER trg_extra_attendance_updated_at
  BEFORE UPDATE ON extra_attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
