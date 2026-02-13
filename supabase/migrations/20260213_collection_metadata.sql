alter table public.cards
  add column if not exists person_name text,
  add column if not exists card_style text;
