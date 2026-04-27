-- Phase 2: Create custom ENUMs
-- These enums define the allowed values for key columns

create type user_role as enum ('admin', 'user');
create type user_status as enum ('pending', 'active', 'suspended');
create type gender_type as enum ('Nam', 'Nữ', 'Khác');
create type session_status as enum ('draft', 'completed', 'archived');
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
-- Phase 2: Create indexes for query performance

-- Responses: fast lookup by session + question for upsert
create index idx_responses_session_question on responses (session_id, question_key);

-- Responses: fast aggregation by question_key (for insights charts)
create index idx_responses_question_key on responses (question_key);

-- Session notes: fast lookup by session
create index idx_session_notes_session on session_notes (session_id);

-- Session notes: notable notes for Product Analysis
create index idx_session_notes_notable on session_notes (is_notable) where is_notable = true;

-- Interview sessions: filter by status
create index idx_sessions_status on interview_sessions (session_status);

-- Interview sessions: filter by respondent type
create index idx_sessions_respondent_type on interview_sessions (respondent_type);

-- Interview sessions: filter by creator
create index idx_sessions_created_by on interview_sessions (created_by);

-- Users: lookup by role/status for admin panel
create index idx_users_role_status on users (role, status);
-- Phase 2: Enable RLS and create policies

-- Enable RLS on all tables
alter table users enable row level security;
alter table interview_sessions enable row level security;
alter table responses enable row level security;
alter table session_notes enable row level security;
alter table admin_insights enable row level security;

-- ============================================================
-- Users policies
-- ============================================================

-- Users can read their own profile
create policy "users_select_own" on users for select
  using (auth.uid() = id);

-- Admins can read all users
create policy "users_select_admin" on users for select
  using (exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Users can update their own profile (name, avatar)
create policy "users_update_own" on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any user (role, status, etc.)
create policy "users_update_admin" on users for update
  using (exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Only the system (via trigger/function) inserts users; allow insert for new registrations
create policy "users_insert_own" on users for insert
  with check (auth.uid() = id);

-- Admins can delete users
create policy "users_delete_admin" on users for delete
  using (exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- ============================================================
-- Interview sessions policies
-- ============================================================

-- Owner or admin can view sessions
create policy "sessions_select" on interview_sessions for select
  using (
    auth.uid() = created_by
    or exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

-- Users insert their own sessions
create policy "sessions_insert" on interview_sessions for insert
  with check (auth.uid() = created_by);

-- Owner or admin can update sessions
create policy "sessions_update" on interview_sessions for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

-- Owner or admin can delete sessions
create policy "sessions_delete" on interview_sessions for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Responses policies (follow session ownership)
-- ============================================================

create policy "responses_select" on responses for select
  using (exists (
    select 1 from interview_sessions s
    where s.id = responses.session_id
    and (
      s.created_by = auth.uid()
      or exists (select 1 from users where id = auth.uid() and role = 'admin')
    )
  ));

create policy "responses_insert" on responses for insert
  with check (exists (
    select 1 from interview_sessions s
    where s.id = responses.session_id
    and s.created_by = auth.uid()
  ));

create policy "responses_update" on responses for update
  using (exists (
    select 1 from interview_sessions s
    where s.id = responses.session_id
    and (
      s.created_by = auth.uid()
      or exists (select 1 from users where id = auth.uid() and role = 'admin')
    )
  ));

create policy "responses_delete" on responses for delete
  using (exists (
    select 1 from interview_sessions s
    where s.id = responses.session_id
    and (
      s.created_by = auth.uid()
      or exists (select 1 from users where id = auth.uid() and role = 'admin')
    )
  ));

-- ============================================================
-- Session notes policies (follow session ownership)
-- ============================================================

create policy "notes_select" on session_notes for select
  using (exists (
    select 1 from interview_sessions s
    where s.id = session_notes.session_id
    and (
      s.created_by = auth.uid()
      or exists (select 1 from users where id = auth.uid() and role = 'admin')
    )
  ));

create policy "notes_insert" on session_notes for insert
  with check (exists (
    select 1 from interview_sessions s
    where s.id = session_notes.session_id
    and s.created_by = auth.uid()
  ));

create policy "notes_update" on session_notes for update
  using (exists (
    select 1 from interview_sessions s
    where s.id = session_notes.session_id
    and (
      s.created_by = auth.uid()
      or exists (select 1 from users where id = auth.uid() and role = 'admin')
    )
  ));

create policy "notes_delete" on session_notes for delete
  using (exists (
    select 1 from interview_sessions s
    where s.id = session_notes.session_id
    and (
      s.created_by = auth.uid()
      or exists (select 1 from users where id = auth.uid() and role = 'admin')
    )
  ));

-- ============================================================
-- Admin insights policies (admin only)
-- ============================================================

-- Anyone authenticated can read insights
create policy "insights_select" on admin_insights for select
  using (auth.uid() is not null);

-- Only admins can insert/update/delete insights
create policy "insights_insert_admin" on admin_insights for insert
  with check (exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  ));

create policy "insights_update_admin" on admin_insights for update
  using (exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  ));

create policy "insights_delete_admin" on admin_insights for delete
  using (exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  ));
-- Phase 2: Database functions and triggers

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger sessions_updated_at
  before update on interview_sessions
  for each row execute function update_updated_at();

create trigger responses_updated_at
  before update on responses
  for each row execute function update_updated_at();

create trigger session_notes_updated_at
  before update on session_notes
  for each row execute function update_updated_at();

create trigger admin_insights_updated_at
  before update on admin_insights
  for each row execute function update_updated_at();

-- ============================================================
-- Auto-create user profile on Supabase Auth signup
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'user',
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Update last_login_at on sign in
-- ============================================================

create or replace function handle_user_login()
returns trigger as $$
begin
  update public.users
  set last_login_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Note: This trigger fires on auth.sessions insert (new login)
-- Supabase creates a session row on each sign-in
create trigger on_auth_user_login
  after insert on auth.sessions
  for each row execute function handle_user_login();

-- ============================================================
-- Aggregation RPC functions for Insights charts
-- ============================================================

-- Aggregate single-select (radio) answers for a given question_key
create or replace function aggregate_radio_answers(p_question_key text)
returns table(answer_value text, count bigint) as $$
begin
  return query
    select
      r.answer_value #>> '{}' as answer_value,
      count(*)::bigint as count
    from responses r
    join interview_sessions s on s.id = r.session_id
    where r.question_key = p_question_key
      and s.session_status = 'completed'
    group by r.answer_value #>> '{}'
    order by count desc;
end;
$$ language plpgsql stable;

-- Aggregate multi-select (checkbox) answers for a given question_key
create or replace function aggregate_checkbox_answers(p_question_key text)
returns table(answer_value text, count bigint) as $$
begin
  return query
    select
      elem::text as answer_value,
      count(*)::bigint as count
    from responses r
    join interview_sessions s on s.id = r.session_id,
    jsonb_array_elements_text(
      case
        when jsonb_typeof(r.answer_value) = 'array' then r.answer_value
        when r.answer_value ? 'value' then r.answer_value->'value'
        else '[]'::jsonb
      end
    ) as elem
    where r.question_key = p_question_key
      and s.session_status = 'completed'
    group by elem::text
    order by count desc;
end;
$$ language plpgsql stable;

-- Aggregate numeric (scale/number) answers for a given question_key
create or replace function aggregate_numeric_answers(p_question_key text)
returns table(avg_value numeric, min_value numeric, max_value numeric, count bigint,
              p25 numeric, p50 numeric, p75 numeric) as $$
begin
  return query
    select
      avg((r.answer_value #>> '{}')::numeric) as avg_value,
      min((r.answer_value #>> '{}')::numeric) as min_value,
      max((r.answer_value #>> '{}')::numeric) as max_value,
      count(*)::bigint as count,
      percentile_cont(0.25) within group (order by (r.answer_value #>> '{}')::numeric) as p25,
      percentile_cont(0.50) within group (order by (r.answer_value #>> '{}')::numeric) as p50,
      percentile_cont(0.75) within group (order by (r.answer_value #>> '{}')::numeric) as p75
    from responses r
    join interview_sessions s on s.id = r.session_id
    where r.question_key = p_question_key
      and s.session_status = 'completed'
      and jsonb_typeof(r.answer_value) = 'number'
         or (r.answer_value #>> '{}')::text ~ '^\d+\.?\d*$';
end;
$$ language plpgsql stable;

-- Cross-tabulation: question answer by respondent_type (for segment analysis)
create or replace function cross_tab_by_segment(p_question_key text)
returns table(respondent_type text, answer_value text, count bigint) as $$
begin
  return query
    select
      s.respondent_type,
      r.answer_value #>> '{}' as answer_value,
      count(*)::bigint as count
    from responses r
    join interview_sessions s on s.id = r.session_id
    where r.question_key = p_question_key
      and s.session_status = 'completed'
    group by s.respondent_type, r.answer_value #>> '{}'
    order by s.respondent_type, count desc;
end;
$$ language plpgsql stable;

-- Cross-tabulation for checkbox answers by segment
create or replace function cross_tab_checkbox_by_segment(p_question_key text)
returns table(respondent_type text, answer_value text, count bigint) as $$
begin
  return query
    select
      s.respondent_type,
      elem::text as answer_value,
      count(*)::bigint as count
    from responses r
    join interview_sessions s on s.id = r.session_id,
    jsonb_array_elements_text(
      case
        when jsonb_typeof(r.answer_value) = 'array' then r.answer_value
        when r.answer_value ? 'value' then r.answer_value->'value'
        else '[]'::jsonb
      end
    ) as elem
    where r.question_key = p_question_key
      and s.session_status = 'completed'
    group by s.respondent_type, elem::text
    order by s.respondent_type, count desc;
end;
$$ language plpgsql stable;

-- NPS calculation
create or replace function calculate_nps()
returns table(promoters bigint, passives bigint, detractors bigint,
              total bigint, nps_score numeric) as $$
begin
  return query
    with scores as (
      select (r.answer_value #>> '{}')::integer as score
      from responses r
      join interview_sessions s on s.id = r.session_id
      where r.question_key = 'T6'
        and s.session_status = 'completed'
        and jsonb_typeof(r.answer_value) = 'number'
    )
    select
      count(*) filter (where score >= 9) as promoters,
      count(*) filter (where score >= 7 and score <= 8) as passives,
      count(*) filter (where score <= 6) as detractors,
      count(*) as total,
      case
        when count(*) > 0 then
          round(
            (count(*) filter (where score >= 9)::numeric / count(*)
             - count(*) filter (where score <= 6)::numeric / count(*))
            * 100, 1
          )
        else 0
      end as nps_score
    from scores;
end;
$$ language plpgsql stable;
