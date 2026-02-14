-- Complete schema for 来世ガチャ system
-- Run this in Supabase SQL Editor if tables don't exist

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- CORE TABLES (from 20260212_initial_schema.sql)
-- ============================================================

-- Sessions to track anonymous users
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Characters available in the reincarnation gacha
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  expectation_level int not null default 1 check (expectation_level between 1 and 12),
  thumbnail_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cards tied to characters with star and rarity metadata
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  card_name text not null,
  star_level int not null check (star_level between 1 and 12),
  rarity text not null check (rarity in ('N','R','SR','SSR','UR','LR')),
  card_image_url text not null,
  description text,
  has_reversal boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reincarnation pre-story scenes
create table if not exists public.pre_stories (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  pattern text not null,
  scene_order int not null default 0,
  video_url text not null,
  duration_seconds int not null default 6,
  description text,
  created_at timestamptz not null default now(),
  unique(character_id, pattern, scene_order)
);

-- Chance scenes
create table if not exists public.chance_scenes (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  pattern text not null,
  video_url text not null,
  duration_seconds int not null default 6,
  description text,
  created_at timestamptz not null default now(),
  unique(character_id, pattern)
);

-- Video assets table
create table if not exists public.video_assets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  storage_path text not null,
  thumbnail_url text,
  duration_seconds int not null default 6,
  aspect_ratio text not null default '9:16',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(storage_path)
);

-- Scenario phase enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'scenario_phase') then
    create type public.scenario_phase as enum ('pre_story', 'chance', 'main_story', 'reversal');
  end if;
end$$;

-- Scenarios
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  phase public.scenario_phase not null,
  scene_order int not null default 0,
  video_asset_id uuid references public.video_assets(id) on delete set null,
  video_url text,
  duration_seconds int not null default 6,
  telop_text text,
  telop_type text not null default 'neutral' check (telop_type in ('neutral','chance','win','lose','reversal','epic')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(card_id, phase, scene_order)
);

-- Gacha configuration
create table if not exists public.gacha_config (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  rtp_config jsonb not null default '[]'::jsonb,
  reversal_rates jsonb not null default '{}'::jsonb,
  character_weights jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Gacha results
create table if not exists public.gacha_results (
  id uuid primary key default gen_random_uuid(),
  user_session_id uuid not null references public.user_sessions(id) on delete cascade,
  character_id uuid not null references public.characters(id),
  card_id uuid references public.cards(id),
  star_level int not null check (star_level between 1 and 12),
  had_reversal boolean not null default false,
  scenario_snapshot jsonb not null,
  card_awarded boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists gacha_results_session_idx on public.gacha_results(user_session_id);
create index if not exists gacha_results_character_idx on public.gacha_results(character_id);

-- Card collection
create table if not exists public.card_collection (
  id uuid primary key default gen_random_uuid(),
  user_session_id uuid not null references public.user_sessions(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  obtained_at timestamptz not null default now(),
  gacha_result_id uuid references public.gacha_results(id) on delete set null,
  unique(user_session_id, card_id)
);

create index if not exists card_collection_session_idx on public.card_collection(user_session_id);

-- ============================================================
-- FEATURE PARITY (from 20260213_feature_parity.sql)
-- ============================================================

-- App users
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Add columns to user_sessions if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'user_sessions' and column_name = 'app_user_id') then
    alter table public.user_sessions add column app_user_id uuid references public.app_users(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'user_sessions' and column_name = 'last_seen_at') then
    alter table public.user_sessions add column last_seen_at timestamptz not null default now();
  end if;
end$$;

-- Ticket types
create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  color_token text,
  sort_order int not null default 0,
  purchasable boolean not null default false,
  created_at timestamptz not null default now()
);

-- User tickets
create table if not exists public.user_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, ticket_type_id)
);

-- Insert default ticket types
insert into public.ticket_types (code, name, description, color_token, sort_order, purchasable)
values
  ('free', 'フリーチケット', 'ログインでもらえる体験用', 'neon-blue', 0, false),
  ('basic', 'ベーシックチケット', '通常ガチャ用の基本チケット', 'neon-yellow', 1, true),
  ('epic', 'エピックチケット', '高レア演出が入りやすい', 'neon-pink', 2, true),
  ('premium', 'プレミアムチケット', 'レア書解放のための特別チケット', 'neon-purple', 3, true),
  ('ex', 'EXチケット', 'キャンペーン専用', 'glow-green', 4, false)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  color_token = excluded.color_token,
  sort_order = excluded.sort_order,
  purchasable = excluded.purchasable;

-- RTP settings
create table if not exists public.rtp_settings (
  star int primary key check (star between 1 and 12),
  probability numeric(6,4) not null,
  updated_at timestamptz not null default now()
);

-- Donden rate settings
create table if not exists public.donden_rate_settings (
  star int primary key check (star between 1 and 12),
  rate numeric(6,4) not null,
  updated_at timestamptz not null default now()
);

-- Tsuigeki settings
create table if not exists public.tsuigeki_settings (
  star int primary key check (star between 1 and 12),
  success_rate numeric(6,4) not null,
  card_count_on_success int not null default 2,
  bonus_third_rate numeric(6,4),
  updated_at timestamptz not null default now()
);

-- Insert default RTP
insert into public.rtp_settings (star, probability)
values
  (1, 0.15),(2, 0.13),(3,0.12),(4,0.11),(5,0.10),(6,0.09),(7,0.08),(8,0.07),(9,0.05),(10,0.04),(11,0.04),(12,0.02)
on conflict (star) do update set probability = excluded.probability, updated_at = now();

-- Insert default donden rates
insert into public.donden_rate_settings (star, rate)
values
  (1,0.02),(2,0.03),(3,0.04),(4,0.06),(5,0.08),(6,0.10),(7,0.12),(8,0.15),(9,0.18),(10,0.22),(11,0.25),(12,0.30)
on conflict (star) do update set rate = excluded.rate, updated_at = now();

-- Insert default tsuigeki
insert into public.tsuigeki_settings (star, success_rate, card_count_on_success, bonus_third_rate)
values
  (10,0.35,2,0.05),
  (11,0.45,2,0.08),
  (12,0.50,2,0.12)
on conflict (star) do update set
  success_rate = excluded.success_rate,
  card_count_on_success = excluded.card_count_on_success,
  bonus_third_rate = excluded.bonus_third_rate,
  updated_at = now();

-- Gacha history
create table if not exists public.gacha_history (
  id uuid primary key default gen_random_uuid(),
  user_session_id uuid references public.user_sessions(id) on delete cascade,
  app_user_id uuid references public.app_users(id) on delete cascade,
  multi_session_id uuid,
  star_level int not null,
  scenario jsonb not null,
  result text,
  had_reversal boolean not null default false,
  gacha_type text not null default 'single',
  created_at timestamptz not null default now()
);

-- Add columns to gacha_results if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'gacha_results' and column_name = 'app_user_id') then
    alter table public.gacha_results add column app_user_id uuid references public.app_users(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'gacha_results' and column_name = 'history_id') then
    alter table public.gacha_results add column history_id uuid references public.gacha_history(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'gacha_results' and column_name = 'obtained_via') then
    alter table public.gacha_results add column obtained_via text not null default 'single_gacha';
  end if;
end$$;

-- Add columns to cards if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'cards' and column_name = 'max_supply') then
    alter table public.cards add column max_supply int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'cards' and column_name = 'current_supply') then
    alter table public.cards add column current_supply int not null default 0;
  end if;
end$$;

-- Card inventory
create table if not exists public.card_inventory (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  serial_number int not null,
  obtained_at timestamptz not null default now(),
  obtained_via text not null default 'single_gacha',
  gacha_result_id uuid references public.gacha_results(id) on delete set null,
  unique (card_id, serial_number)
);

create index if not exists card_inventory_user_idx on public.card_inventory(app_user_id);

-- Add app_user_id to card_collection if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'card_collection' and column_name = 'app_user_id') then
    alter table public.card_collection add column app_user_id uuid references public.app_users(id) on delete cascade;
  end if;
end$$;

create unique index if not exists card_collection_user_unique on public.card_collection(app_user_id, card_id);

-- Helper function for card serial numbers
create or replace function public.next_card_serial(target_card_id uuid)
returns int
language plpgsql
as $$
declare
  new_serial int;
begin
  update public.cards
  set current_supply = coalesce(current_supply, 0) + 1
  where id = target_card_id
  returning current_supply into new_serial;
  if new_serial is null then
    raise exception 'カードが見つかりません';
  end if;
  return new_serial;
end;
$$;
