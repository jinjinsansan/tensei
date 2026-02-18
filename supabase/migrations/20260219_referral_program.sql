-- Referral program enhancements (settings, per-user flags, reward tracking)

alter table public.app_users
  add column if not exists referral_blocked boolean not null default false,
  add column if not exists referred_by_user_id uuid references public.app_users(id) on delete set null;

create table if not exists public.referral_settings (
  id text primary key default 'global',
  referrer_ticket_amount int not null default 10,
  referee_ticket_amount int not null default 10,
  ticket_code text not null default 'basic',
  updated_by uuid references public.app_users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.referral_settings (id, referrer_ticket_amount, referee_ticket_amount, ticket_code)
values ('global', 10, 10, 'basic')
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'referral_claims' and column_name = 'reward_tickets'
  ) then
    alter table public.referral_claims rename column reward_tickets to referee_reward_tickets;
  end if;
exception when undefined_column then
  null;
end$$;

alter table public.referral_claims
  add column if not exists referee_reward_tickets int not null default 0,
  add column if not exists referrer_reward_tickets int not null default 0,
  add column if not exists granted_at timestamptz;

create unique index if not exists referral_claims_invited_unique on public.referral_claims(invited_user_id);

create or replace function public.handle_referral_friendship()
returns trigger
language plpgsql
as $$
declare
  ref_owner uuid;
begin
  if NEW.status <> 'granted' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and OLD.status is not distinct from NEW.status then
    return NEW;
  end if;

  select app_user_id into ref_owner from public.referral_codes where id = NEW.referral_code_id;
  if ref_owner is null then
    return NEW;
  end if;

  insert into public.friends(user_id, friend_user_id)
  values (ref_owner, NEW.invited_user_id)
  on conflict (user_id, friend_user_id) do nothing;

  insert into public.friends(user_id, friend_user_id)
  values (NEW.invited_user_id, ref_owner)
  on conflict (user_id, friend_user_id) do nothing;

  return NEW;
end;
$$;

drop trigger if exists referral_friendship_after_update on public.referral_claims;
create trigger referral_friendship_after_change
  after insert or update of status on public.referral_claims
  for each row
  when (NEW.status = 'granted')
  execute function public.handle_referral_friendship();
