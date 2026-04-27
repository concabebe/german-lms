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
