alter table if exists public.gacha_global_config
  add column if not exists line_reward_points integer not null default 50;

update public.gacha_global_config
set line_reward_points = coalesce(line_reward_points, 50)
where id = '00000000-0000-0000-0000-000000000001';

comment on column public.gacha_global_config.line_reward_points is 'LINE公式アカウント特典で付与されるNポイントの基準値';
