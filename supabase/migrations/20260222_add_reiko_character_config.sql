-- 麗子モジュール: ガチャ有効化設定（初期は非アクティブ）
insert into public.gacha_characters (character_id, character_name, is_active, weight)
values ('reiko', '霊能者・麗子', false, 0)
on conflict (character_id) do update
set character_name = excluded.character_name,
    updated_at = now();

-- 麗子用 RTP 初期値（管理画面から後で調整可能）
insert into public.gacha_rtp_config (
  character_id,
  loss_rate,
  rarity_n,
  rarity_r,
  rarity_sr,
  rarity_ssr,
  rarity_ur,
  rarity_lr,
  star_distribution,
  donden_rate,
  updated_at
)
values (
  'reiko',
  60,
  40,
  30,
  15,
  9,
  4,
  2,
  '[20,20,15,15,8,7,5,4,2,2,1,1]'::jsonb,
  15,
  now()
)
on conflict (character_id) do update
set loss_rate = excluded.loss_rate,
    rarity_n = excluded.rarity_n,
    rarity_r = excluded.rarity_r,
    rarity_sr = excluded.rarity_sr,
    rarity_ssr = excluded.rarity_ssr,
    rarity_ur = excluded.rarity_ur,
    rarity_lr = excluded.rarity_lr,
    star_distribution = excluded.star_distribution,
    donden_rate = excluded.donden_rate,
    updated_at = excluded.updated_at;
