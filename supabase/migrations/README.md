# Database Migrations

## How to Apply

Run these SQL files in order in the Supabase SQL Editor (Dashboard → SQL Editor → New Query):

1. `20260427_001_create_enums.sql` — Custom enum types
2. `20260427_002_create_tables.sql` — All tables (users, interview_sessions, responses, session_notes, admin_insights)
3. `20260427_003_create_indexes.sql` — Performance indexes
4. `20260427_004_create_rls_policies.sql` — Row-Level Security policies
5. `20260427_005_create_functions.sql` — Triggers, auto-user-creation, aggregation RPCs

Or run the combined file:
- `combined_migration.sql` — All of the above in one file

## What's Included

### Tables
- **users** — Mirrors Supabase Auth with role/status. Auto-created on signup via trigger.
- **interview_sessions** — Interview session metadata + respondent info.
- **responses** — One row per question per session. JSONB `answer_value` supports radio/checkbox/scale/number/textarea.
- **session_notes** — Interviewer notes per section with sentiment hints.
- **admin_insights** — Admin-editable insight cards for Product Analysis.

### RLS Policies
- Users can only see/edit their own sessions, responses, and notes.
- Admins can see/edit everything.
- Admin insights are readable by all authenticated users, writable only by admins.

### Triggers
- `updated_at` auto-updates on all tables.
- `handle_new_user()` — Auto-creates a `users` row when someone signs up via Supabase Auth (status=pending).
- `handle_user_login()` — Updates `last_login_at` on each sign-in.

### Aggregation Functions (RPCs)
- `aggregate_radio_answers(question_key)` — Count radio answers.
- `aggregate_checkbox_answers(question_key)` — Count checkbox answer items.
- `aggregate_numeric_answers(question_key)` — Stats for numeric answers (avg, min, max, percentiles).
- `cross_tab_by_segment(question_key)` — Cross-tab answers by respondent type.
- `cross_tab_checkbox_by_segment(question_key)` — Cross-tab checkbox answers by segment.
- `calculate_nps()` — NPS score from T6 question.

## Unique Constraints
- `responses(session_id, question_key)` — Enables upsert for auto-save.
- `session_notes(session_id, section_key)` — One note per section per session.
- `admin_insights(section_key)` — One insight card per section.
