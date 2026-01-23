-- Create Classes Table
create table classes (
  id text primary key,
  name text not null,
  category text not null,
  schedule jsonb, -- Stores { morning: [], afternoon: [], evening: [] }
  fee_per_session integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create Students Table
create table students (
  id text primary key,
  name text not null,
  birth_year integer,
  phone text,
  enroll_date date not null,
  leave_date date,
  class_id text references classes(id),
  status text not null, -- 'Mới nhập học', 'Đang học', 'Đã nghỉ'
  discount_rate numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create Fees Table (Tuition Payments)
create table fees (
  id text primary key,
  student_id text references students(id),
  amount integer not null,
  date date not null,
  method text, -- 'Tiền mặt', 'Chuyển khoản'
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create Extra Attendance Table (Buổi học bổ sung)
create table extra_attendance (
  id text primary key,
  student_id text references students(id),
  date date not null,
  status boolean default true,
  fee integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create Holidays Table (Lịch nghỉ)
create table holidays (
  id text primary key,
  date date not null,
  description text,
  type text default 'Nghỉ Lễ', -- 'Nghỉ Lễ' or 'Nghỉ đột xuất'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security (RLS) policies can be added here if needed for public/private access.
-- For now, we assume service role or authenticated access.
