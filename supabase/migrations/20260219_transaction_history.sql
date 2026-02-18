-- Transaction history tables to capture user-facing ledger data

create table if not exists public.ticket_purchase_history (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  quantity int not null check (quantity > 0),
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'JPY',
  payment_method text not null default 'untracked',
  external_reference text,
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded','cancelled')),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_purchase_history_user_idx
  on public.ticket_purchase_history(app_user_id, created_at desc);

create index if not exists ticket_purchase_history_ticket_idx
  on public.ticket_purchase_history(ticket_type_id);
