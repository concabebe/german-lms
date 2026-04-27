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
