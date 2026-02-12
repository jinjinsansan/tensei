-- Aggregation helpers for admin statistics dashboard
create or replace function public.get_gacha_summary_stats()
returns table (
  total_plays bigint,
  reversal_count bigint,
  last_play timestamptz,
  average_star numeric
)
language sql
stable
as $$
  select
    count(*)::bigint as total_plays,
    count(*) filter (where had_reversal)::bigint as reversal_count,
    max(created_at) as last_play,
    avg(star_level)::numeric as average_star
  from public.gacha_results;
$$;

comment on function public.get_gacha_summary_stats is 'Returns aggregate counts for overall gacha performance.';

create or replace function public.get_gacha_star_counts()
returns table (
  star_level int,
  total bigint
)
language sql
stable
as $$
  select star_level, count(*)::bigint as total
  from public.gacha_results
  group by star_level
  order by star_level;
$$;

comment on function public.get_gacha_star_counts is 'Returns total pulls per star level.';

create or replace function public.get_gacha_card_leaderboard(limit_count int default 5)
returns table (
  card_id uuid,
  card_name text,
  rarity text,
  star_level int,
  total bigint
)
language sql
stable
as $$
  select
    c.id,
    c.card_name,
    c.rarity,
    c.star_level,
    count(gr.*)::bigint as total
  from public.gacha_results gr
  join public.cards c on c.id = gr.card_id
  group by c.id, c.card_name, c.rarity, c.star_level
  order by total desc, c.star_level desc
  limit limit_count;
$$;

comment on function public.get_gacha_card_leaderboard is 'Lists the most frequently drawn cards.';
