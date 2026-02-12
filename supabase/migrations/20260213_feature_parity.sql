-- Core user/auth tables
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

alter table public.user_sessions
  add column if not exists app_user_id uuid references public.app_users(id) on delete cascade,
  add column if not exists last_seen_at timestamptz not null default now();

-- Ticket management
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

create table if not exists public.user_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, ticket_type_id)
);

insert into public.ticket_types (code, name, description, color_token, sort_order, purchasable)
values
  ('free', '無料の栞', 'デイリーログインでもらえる体験用', 'bookmark-free', 0, false),
  ('basic', '銅の栞', '通常ガチャ用の基本栞', 'bookmark-bronze', 1, true),
  ('epic', '銀の栞', '高レア演出が入りやすい栞', 'bookmark-silver', 2, true),
  ('premium', '金の栞', 'レア書解放のための特別栞', 'bookmark-gold', 3, true),
  ('ex', '白金の栞', 'キャンペーンやコラボ専用', 'bookmark-platinum', 4, false)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  color_token = excluded.color_token,
  sort_order = excluded.sort_order,
  purchasable = excluded.purchasable;

-- RTP & reversal configuration
create table if not exists public.rtp_settings (
  star int primary key check (star between 1 and 12),
  probability numeric(6,4) not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.donden_rate_settings (
  star int primary key check (star between 1 and 12),
  rate numeric(6,4) not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.tsuigeki_settings (
  star int primary key check (star between 1 and 12),
  success_rate numeric(6,4) not null,
  card_count_on_success int not null default 2,
  bonus_third_rate numeric(6,4),
  updated_at timestamptz not null default now()
);

insert into public.rtp_settings (star, probability)
values
  (1, 0.15),(2, 0.13),(3,0.12),(4,0.11),(5,0.10),(6,0.09),(7,0.08),(8,0.07),(9,0.05),(10,0.04),(11,0.04),(12,0.02)
on conflict (star) do update set probability = excluded.probability, updated_at = now();

insert into public.donden_rate_settings (star, rate)
values
  (1,0.02),(2,0.03),(3,0.04),(4,0.06),(5,0.08),(6,0.10),(7,0.12),(8,0.15),(9,0.18),(10,0.22),(11,0.25),(12,0.30)
on conflict (star) do update set rate = excluded.rate, updated_at = now();

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

-- History & inventory
-- Multi gacha sessions
create table if not exists public.multi_gacha_sessions (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  total_pulls int not null,
  pulls_completed int not null default 0,
  status text not null default 'pending' check (status in ('pending','running','completed','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gacha_history (
  id uuid primary key default gen_random_uuid(),
  user_session_id uuid references public.user_sessions(id) on delete cascade,
  app_user_id uuid references public.app_users(id) on delete cascade,
  multi_session_id uuid references public.multi_gacha_sessions(id) on delete set null,
  star_level int not null,
  scenario jsonb not null,
  result text,
  had_reversal boolean not null default false,
  gacha_type text not null default 'single',
  created_at timestamptz not null default now()
);

alter table public.gacha_results
  add column if not exists app_user_id uuid references public.app_users(id) on delete cascade,
  add column if not exists history_id uuid references public.gacha_history(id) on delete set null,
  add column if not exists obtained_via text not null default 'single_gacha';

alter table public.cards
  add column if not exists max_supply int,
  add column if not exists current_supply int not null default 0;

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

alter table public.card_collection
  add column if not exists app_user_id uuid references public.app_users(id) on delete cascade;

create unique index if not exists card_collection_user_unique on public.card_collection(app_user_id, card_id);

-- Referral & LINE integration
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  code text not null unique,
  usage_limit int,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_claims (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  invited_user_id uuid not null references public.app_users(id) on delete cascade,
  reward_tickets int not null default 0,
  status text not null default 'pending' check (status in ('pending','granted','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.line_link_requests (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  state_token text not null,
  linked boolean not null default false,
  created_at timestamptz not null default now(),
  linked_at timestamptz
);

create index if not exists line_link_requests_user_idx on public.line_link_requests(app_user_id);

-- helper to atomically increment card supply and return serial number
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
