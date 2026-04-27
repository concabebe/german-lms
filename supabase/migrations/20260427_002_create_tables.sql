-- Phase 2: Create all tables

-- Users (mirrors Supabase Auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role user_role not null default 'user',
  status user_status not null default 'pending',
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Interview sessions
create table interview_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references users(id) not null,
  respondent_type text not null default 'learner',
  respondent_full_name text not null,
  respondent_birth_year integer not null,
  respondent_gender gender_type not null,
  respondent_location text not null,
  respondent_occupation text,
  respondent_phone text,
  session_status session_status default 'draft',
  session_note text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Question responses (one row per question per session)
create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references interview_sessions(id) on delete cascade not null,
  question_key text not null,
  answer_value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, question_key)
);

-- Interviewer notes per section
create table session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references interview_sessions(id) on delete cascade not null,
  section_key text not null,
  note_text text not null,
  tagged_questions text[],
  sentiment_hint text,
  is_notable boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, section_key)
);

-- Admin-editable insight cards (for Product Analysis)
create table admin_insights (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  content text not null default '',
  updated_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
