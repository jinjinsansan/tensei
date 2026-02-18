-- Star-level RTP distribution per character
alter table public.gacha_rtp_config
  add column if not exists star_distribution jsonb not null default '[]'::jsonb;

-- Backfill star_distribution from legacy rarity columns if empty
do $$
declare
  rec record;
  rarity_n numeric;
  rarity_r numeric;
  rarity_sr numeric;
  rarity_ssr numeric;
  rarity_ur numeric;
  rarity_lr numeric;
begin
  for rec in select id, rarity_n, rarity_r, rarity_sr, rarity_ssr, rarity_ur, rarity_lr from public.gacha_rtp_config loop
    rarity_n := coalesce(rec.rarity_n, 0);
    rarity_r := coalesce(rec.rarity_r, 0);
    rarity_sr := coalesce(rec.rarity_sr, 0);
    rarity_ssr := coalesce(rec.rarity_ssr, 0);
    rarity_ur := coalesce(rec.rarity_ur, 0);
    rarity_lr := coalesce(rec.rarity_lr, 0);

    update public.gacha_rtp_config
    set star_distribution = jsonb_build_array(
      rarity_n / 2, rarity_n / 2,
      rarity_r / 2, rarity_r / 2,
      rarity_sr / 2, rarity_sr / 2,
      rarity_ssr / 2, rarity_ssr / 2,
      rarity_ur / 2, rarity_ur / 2,
      rarity_lr / 2, rarity_lr / 2
    )
    where id = rec.id
      and (star_distribution = '[]'::jsonb or star_distribution is null);
  end loop;
end $$;
