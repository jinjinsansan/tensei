-- Admin supply controls & user management support (2026-02-18)

-- Extend app_users with admin flags and login bonus tracking
alter table public.app_users
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_blocked boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists login_bonus_last_claim_at timestamptz,
  add column if not exists login_bonus_streak int not null default 0;

-- Loss card identification for unlimited supply handling
alter table public.cards
  add column if not exists is_loss_card boolean not null default false;

update public.cards
set is_loss_card = true,
    max_supply = null
where card_name = '転生失敗';

-- Enforce max_supply limits when issuing serials (loss cards stay unlimited)
create or replace function public.next_card_serial(target_card_id uuid)
returns int
language plpgsql
as $$
declare
  new_serial int;
  limit_value int;
  loss_flag boolean;
begin
  select max_supply, is_loss_card
  into limit_value, loss_flag
  from public.cards
  where id = target_card_id
  for update;

  if not found then
    raise exception 'カードが見つかりません';
  end if;

  if loss_flag is false and limit_value is not null then
    update public.cards
    set current_supply = coalesce(current_supply, 0) + 1
    where id = target_card_id
      and (current_supply is null or current_supply < limit_value)
    returning current_supply into new_serial;

    if new_serial is null then
      raise exception 'Max supply reached for %', target_card_id;
    end if;
  else
    update public.cards
    set current_supply = coalesce(current_supply, 0) + 1
    where id = target_card_id
    returning current_supply into new_serial;
  end if;

  return new_serial;
end;
$$;

-- Track detailed gacha history outcomes
alter table public.gacha_history
  alter column result set default 'pending',
  add column if not exists result_detail text;

update public.gacha_history
set result = coalesce(result, 'pending')
where result is null;

create index if not exists gacha_history_app_user_idx on public.gacha_history(app_user_id);

-- Aggregated metrics for admin user dashboard
create or replace function public.get_admin_user_metrics(target_user_ids uuid[])
returns table (
  user_id uuid,
  total_pulls bigint,
  last_gacha_at timestamptz,
  last_card_name text,
  last_card_rarity text,
  pending_results bigint,
  error_results bigint,
  last_error_at timestamptz,
  last_error_detail text,
  last_result_status text
)
language sql
stable
as $$
  with requested_users as (
    select unnest(coalesce(target_user_ids, '{}'::uuid[])) as user_id
  ),
  gacha_counts as (
    select
      app_user_id,
      count(*) as total_pulls,
      sum(case when card_awarded is false then 1 else 0 end) as pending_results,
      max(created_at) as last_gacha_at
    from public.gacha_results
    where app_user_id = any(coalesce(target_user_ids, '{}'::uuid[]))
    group by app_user_id
  ),
  latest_cards as (
    select distinct on (gr.app_user_id)
      gr.app_user_id,
      c.card_name,
      c.rarity
    from public.gacha_results gr
    left join public.cards c on c.id = gr.card_id
    where gr.app_user_id = any(coalesce(target_user_ids, '{}'::uuid[]))
    order by gr.app_user_id, gr.created_at desc
  ),
  error_counts as (
    select
      app_user_id,
      count(*) as error_results
    from public.gacha_history
    where app_user_id = any(coalesce(target_user_ids, '{}'::uuid[]))
      and result = 'error'
    group by app_user_id
  ),
  latest_errors as (
    select distinct on (gh.app_user_id)
      gh.app_user_id,
      gh.result_detail,
      gh.created_at as last_error_at
    from public.gacha_history gh
    where gh.app_user_id = any(coalesce(target_user_ids, '{}'::uuid[]))
      and gh.result = 'error'
    order by gh.app_user_id, gh.created_at desc
  ),
  latest_history as (
    select distinct on (gh.app_user_id)
      gh.app_user_id,
      gh.result as last_result_status
    from public.gacha_history gh
    where gh.app_user_id = any(coalesce(target_user_ids, '{}'::uuid[]))
    order by gh.app_user_id, gh.created_at desc
  )
  select
    ru.user_id,
    coalesce(gc.total_pulls, 0) as total_pulls,
    gc.last_gacha_at,
    lc.card_name as last_card_name,
    lc.rarity as last_card_rarity,
    coalesce(gc.pending_results, 0) as pending_results,
    coalesce(ec.error_results, 0) as error_results,
    le.last_error_at,
    le.result_detail as last_error_detail,
    lh.last_result_status
  from requested_users ru
  left join gacha_counts gc on gc.app_user_id = ru.user_id
  left join latest_cards lc on lc.app_user_id = ru.user_id
  left join error_counts ec on ec.app_user_id = ru.user_id
  left join latest_errors le on le.app_user_id = ru.user_id
  left join latest_history lh on lh.app_user_id = ru.user_id;
$$;
