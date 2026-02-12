-- Enable extensions required for UUID generation
create extension if not exists "pgcrypto";

-- Sessions to track anonymous users until auth is added
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

-- Reincarnation pre-story scenes (before star is revealed)
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

-- Chance scenes triggered before the main story
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

-- Optional video assets table to centralize uploaded media references
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

-- Enum for scenario phases
do $$
begin
  if not exists (select 1 from pg_type where typname = 'scenario_phase') then
    create type public.scenario_phase as enum ('pre_story', 'chance', 'main_story', 'reversal');
  end if;
end$$;

-- Scenes for each card phase (main story and reversal sequences)
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

-- Global gacha configuration (RTP, reversal rate, and character weighting)
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

-- Gacha play + result history
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

-- Collection of cards obtained by a session
create table if not exists public.card_collection (
  id uuid primary key default gen_random_uuid(),
  user_session_id uuid not null references public.user_sessions(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  obtained_at timestamptz not null default now(),
  gacha_result_id uuid references public.gacha_results(id) on delete set null,
  unique(user_session_id, card_id)
);

create index if not exists card_collection_session_idx on public.card_collection(user_session_id);
