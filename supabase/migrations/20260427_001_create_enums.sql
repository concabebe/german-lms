-- Phase 2: Create custom ENUMs
-- These enums define the allowed values for key columns

create type user_role as enum ('admin', 'user');
create type user_status as enum ('pending', 'active', 'suspended');
create type gender_type as enum ('Nam', 'Nữ', 'Khác');
create type session_status as enum ('draft', 'completed', 'archived');
