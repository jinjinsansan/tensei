-- Multi-character v2 schema additions (gacha_characters, gacha_rtp_config, gacha_global_config)

create table if not exists public.gacha_characters (
  id uuid primary key default gen_random_uuid(),
  character_id text not null unique,
  character_name text not null,
  is_active boolean not null default true,
  weight numeric not null default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gacha_rtp_config (
  id uuid primary key default gen_random_uuid(),
  character_id text not null references public.gacha_characters(character_id),
  loss_rate numeric not null default 60,
  rarity_n numeric not null default 35,
  rarity_r numeric not null default 25,
  rarity_sr numeric not null default 20,
  rarity_ssr numeric not null default 12,
  rarity_ur numeric not null default 6,
  rarity_lr numeric not null default 2,
  donden_rate numeric not null default 15,
  updated_at timestamptz default now(),
  unique (character_id)
);

create table if not exists public.gacha_global_config (
  id uuid primary key default gen_random_uuid(),
  loss_rate numeric not null default 60,
  updated_at timestamptz default now()
);

insert into public.gacha_characters (character_id, character_name, is_active, weight)
values
  ('kenta', '健太', true, 60),
  ('shoichi', '昭一', false, 40)
on conflict (character_id) do update
set character_name = excluded.character_name,
    is_active = excluded.is_active,
    weight = excluded.weight,
    updated_at = now();

insert into public.gacha_rtp_config (character_id, loss_rate, rarity_n, rarity_r, rarity_sr, rarity_ssr, rarity_ur, rarity_lr, donden_rate)
values
  ('kenta', 60, 35, 25, 20, 12, 6, 2, 15),
  ('shoichi', 60, 35, 25, 20, 12, 6, 2, 15)
on conflict (character_id) do update
set loss_rate = excluded.loss_rate,
    rarity_n = excluded.rarity_n,
    rarity_r = excluded.rarity_r,
    rarity_sr = excluded.rarity_sr,
    rarity_ssr = excluded.rarity_ssr,
    rarity_ur = excluded.rarity_ur,
    rarity_lr = excluded.rarity_lr,
    donden_rate = excluded.donden_rate,
    updated_at = now();

insert into public.gacha_global_config (id, loss_rate)
values ('00000000-0000-0000-0000-000000000001', 60)
on conflict (id) do nothing;
