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
