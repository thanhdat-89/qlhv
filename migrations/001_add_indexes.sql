-- Migration 001: Add missing indexes for performance optimization
-- Apply to Supabase SQL Editor

-- students: thường xuyên join với classes
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- students: query theo trạng thái
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- fees: query theo học sinh và theo ngày/tháng
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_date ON fees(date);
CREATE INDEX IF NOT EXISTS idx_fees_student_date ON fees(student_id, date);

-- extra_attendance: query theo học sinh và ngày
CREATE INDEX IF NOT EXISTS idx_extra_attendance_student_id ON extra_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_extra_attendance_date ON extra_attendance(date);
CREATE INDEX IF NOT EXISTS idx_extra_attendance_student_date ON extra_attendance(student_id, date);

-- holidays: query theo lớp và ngày
CREATE INDEX IF NOT EXISTS idx_holidays_class_id ON holidays(class_id);
CREATE INDEX IF NOT EXISTS idx_holidays_student_id ON holidays(student_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- promotions: query theo lớp và tháng
CREATE INDEX IF NOT EXISTS idx_promotions_class_id ON promotions(class_id);
CREATE INDEX IF NOT EXISTS idx_promotions_class_month ON promotions(class_id, month);

-- student_promotions: query theo học sinh và tháng
CREATE INDEX IF NOT EXISTS idx_student_promotions_student_id ON student_promotions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_student_month ON student_promotions(student_id, month);
