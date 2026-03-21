-- Migration 002: Add CHECK constraints for data integrity
-- Apply to Supabase SQL Editor

-- Validate student status values
ALTER TABLE students ADD CONSTRAINT check_student_status
  CHECK (status IN ('Mới nhập học', 'Đang học', 'Đã nghỉ'));

-- Validate fee payment method values
ALTER TABLE fees ADD CONSTRAINT check_fee_method
  CHECK (method IS NULL OR method IN ('Tiền mặt', 'Chuyển khoản'));

-- Validate fee amount is positive
ALTER TABLE fees ADD CONSTRAINT check_fee_amount
  CHECK (amount > 0);

-- Validate promotion discount_type values
ALTER TABLE promotions ADD CONSTRAINT check_promotions_discount_type
  CHECK (discount_type IN ('percent', 'amount'));

-- Validate promotion discount_rate is between 0 and 100
ALTER TABLE promotions ADD CONSTRAINT check_promotions_discount_rate
  CHECK (discount_rate >= 0 AND discount_rate <= 100);

-- Validate promotion discount_amount is non-negative
ALTER TABLE promotions ADD CONSTRAINT check_promotions_discount_amount
  CHECK (discount_amount >= 0);

-- Validate student_promotions discount_type values
ALTER TABLE student_promotions ADD CONSTRAINT check_student_promotions_discount_type
  CHECK (discount_type IN ('percent', 'amount'));

-- Validate student_promotions discount_rate is between 0 and 100
ALTER TABLE student_promotions ADD CONSTRAINT check_student_promotions_discount_rate
  CHECK (discount_rate >= 0 AND discount_rate <= 100);

-- Validate student_promotions discount_amount is non-negative
ALTER TABLE student_promotions ADD CONSTRAINT check_student_promotions_discount_amount
  CHECK (discount_amount >= 0);

-- Validate holiday type values
ALTER TABLE holidays ADD CONSTRAINT check_holiday_type
  CHECK (type IN ('Nghỉ Lễ', 'Nghỉ đột xuất'));

-- Validate holiday end_date is after or equal to start date
ALTER TABLE holidays ADD CONSTRAINT check_holiday_dates
  CHECK (end_date IS NULL OR end_date >= date);

-- Validate students leave_date is after or equal to enroll_date
ALTER TABLE students ADD CONSTRAINT check_student_dates
  CHECK (leave_date IS NULL OR leave_date >= enroll_date);

-- Validate students discount_rate is between 0 and 100
ALTER TABLE students ADD CONSTRAINT check_student_discount_rate
  CHECK (discount_rate >= 0 AND discount_rate <= 100);
