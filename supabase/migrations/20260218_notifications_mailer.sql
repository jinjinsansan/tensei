-- Notifications inbox + newsletter broadcast + password reset support

create table if not exists public.mail_broadcasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  body_text text not null,
  audience text not null check (audience in ('all', 'individual')),
  target_user_id uuid references public.app_users(id) on delete set null,
  sent_by uuid references public.app_users(id) on delete set null,
  total_recipients integer not null default 0,
  status text not null default 'draft',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mail_broadcasts_created_idx on public.mail_broadcasts(created_at desc);

create table if not exists public.mail_broadcast_logs (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.mail_broadcasts(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  email text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mail_broadcast_logs_broadcast_idx on public.mail_broadcast_logs(broadcast_id);
create index if not exists mail_broadcast_logs_user_idx on public.mail_broadcast_logs(user_id);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  category text not null default 'system',
  title text not null,
  message text not null,
  link_url text,
  metadata jsonb not null default '{}'::jsonb,
  broadcast_id uuid references public.mail_broadcasts(id) on delete set null,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx on public.user_notifications(user_id, created_at desc);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx on public.password_reset_tokens(user_id);
create index if not exists password_reset_tokens_token_idx on public.password_reset_tokens(token);
