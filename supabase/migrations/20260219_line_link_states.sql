create table if not exists public.line_link_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  state text not null unique,
  nonce text not null,
  line_user_id text,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists line_link_states_user_idx on public.line_link_states(user_id);
create index if not exists line_link_states_rewarded_idx on public.line_link_states(rewarded_at);

create unique index if not exists line_link_states_line_user_unique
  on public.line_link_states(line_user_id)
  where line_user_id is not null;

create or replace function public.set_line_link_states_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists line_link_states_set_updated_at on public.line_link_states;

create trigger line_link_states_set_updated_at
before update on public.line_link_states
for each row execute function public.set_line_link_states_updated_at();

insert into public.ticket_types (id, code, name, description, color_token, sort_order, purchasable, created_at)
select gen_random_uuid(), 'n_point', 'Nポイント', 'LINE特典などのキャンペーンで利用するポイント', '#7efde5', 5, false, now()
where not exists (select 1 from public.ticket_types where code = 'n_point');
