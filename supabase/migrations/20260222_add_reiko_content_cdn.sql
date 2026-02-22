-- ============================================================
-- 麗子（reiko）編 完全セットアップ SQL
-- Supabase UI でそのままコピペして実行してください
-- CDN ベース: https://r2-video-worker.goldbenchan.workers.dev/videos
-- ============================================================

-- ① ガチャ有効化設定（初期は非アクティブ・weight=0）
insert into public.gacha_characters (character_id, character_name, is_active, weight)
values ('reiko', '霊能者・麗子', false, 0)
on conflict (character_id) do update
set character_name = excluded.character_name,
    updated_at = now();

-- ② RTP 初期値（管理画面から調整可能）
insert into public.gacha_rtp_config (
  character_id, loss_rate,
  rarity_n, rarity_r, rarity_sr, rarity_ssr, rarity_ur, rarity_lr,
  star_distribution, donden_rate, updated_at
)
values (
  'reiko', 60,
  40, 30, 15, 9, 4, 2,
  '[20,20,15,15,8,7,5,4,2,2,1,1]'::jsonb,
  15, now()
)
on conflict (character_id) do update
set loss_rate      = excluded.loss_rate,
    rarity_n       = excluded.rarity_n,
    rarity_r       = excluded.rarity_r,
    rarity_sr      = excluded.rarity_sr,
    rarity_ssr     = excluded.rarity_ssr,
    rarity_ur      = excluded.rarity_ur,
    rarity_lr      = excluded.rarity_lr,
    star_distribution = excluded.star_distribution,
    donden_rate    = excluded.donden_rate,
    updated_at     = excluded.updated_at;

-- ③ キャラクター本体
insert into public.characters (id, name, description, expectation_level, thumbnail_url, sort_order, is_active, updated_at)
values (
  '11111111-1111-4111-8111-111111111115'::uuid,
  '霊能者・麗子',
  '52歳・自称霊能者。霊感ゼロで借金800万だが、転生先でついに「本物」になるギャップと感動の物語。',
  4,
  '/reiko_cards_v2/reiko_card01.png',
  5,
  true,
  now()
)
on conflict (id) do update set
  name             = excluded.name,
  description      = excluded.description,
  expectation_level = excluded.expectation_level,
  thumbnail_url    = excluded.thumbnail_url,
  sort_order       = excluded.sort_order,
  is_active        = excluded.is_active,
  updated_at       = now();

-- ④ カード12枚
insert into public.cards (id, character_id, card_name, star_level, rarity, card_image_url, description, has_reversal, is_active, sort_order, updated_at)
values
  ('66666666-1111-4111-8111-666666666661'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '野良猫転生',               1,  'N',   '/reiko_cards_v2/reiko_card01.png', '雨の路地裏で野良猫に転生。誰もいないのに大真面目に「波動が低い」と宣告する。',       false, true, 1,  now()),
  ('66666666-1111-4111-8111-666666666662'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '案山子転生',               2,  'N',   '/reiko_cards_v2/reiko_card02.png', '田んぼの案山子に転生。烏に踏み台にされても威厳だけは一丁前。',                   false, true, 2,  now()),
  ('66666666-1111-4111-8111-666666666663'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '邪魔者扱いされる魔女転生', 3,  'R',   '/reiko_cards_v2/reiko_card03.png', '中世ヨーロッパで魔女に転生。村人に追い払われても霊界のお告げを叫び続ける。',       false, true, 3,  now()),
  ('66666666-1111-4111-8111-666666666664'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '平凡な4人家族の母転生',   4,  'R',   '/reiko_cards_v2/reiko_card04.png', '普通の母に転生。夕食も宿題も全て霊能者スタイルで乗り切る。',                     false, true, 4,  now()),
  ('66666666-1111-4111-8111-666666666665'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '江戸時代のお茶屋女将転生', 5,  'SR',  '/reiko_cards_v2/reiko_card05.png', '江戸の茶屋女将に転生。神秘的な威厳が本物の格として機能する。',                   true,  true, 5,  now()),
  ('66666666-1111-4111-8111-666666666666'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '宇宙人転生',               6,  'SR',  '/reiko_cards_v2/reiko_card06.png', '宇宙人に転生。強烈なメイクのまま宇宙船の乗組員を統率する。',                     true,  true, 6,  now()),
  ('66666666-1111-4111-8111-666666666667'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '修道女転生',               7,  'SSR', '/reiko_cards_v2/reiko_card07.png', '修道女に転生。祈りの中で初めて本物の涙を流す。',                                 true,  true, 7,  now()),
  ('66666666-1111-4111-8111-666666666668'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '幕末の女スパイ転生',       8,  'SSR', '/reiko_cards_v2/reiko_card08.png', '幕末の女スパイに転生。大真面目な威圧感が暗躍にぴったりはまる。',                 true,  true, 8,  now()),
  ('66666666-1111-4111-8111-666666666669'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '本物の占い師転生',         9,  'UR',  '/reiko_cards_v2/reiko_card09.png', '本物の霊力を持つ占い師に転生。水晶玉が本当に光り、本当に見えた。',               true,  true, 9,  now()),
  ('66666666-1111-4111-8111-666666666670'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '女王転生',                 10, 'UR',  '/reiko_cards_v2/reiko_card10.png', '大国の女王に転生。表情は何も変わっていない。世界がやっと追いついた。',           true,  true, 10, now()),
  ('66666666-1111-4111-8111-666666666671'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, 'ジャンヌ・ダルク転生',    11, 'LR',  '/reiko_cards_v2/reiko_card11.png', '中世フランスの英雄に転生。羽根扇子を掲げ軍勢を率いて歴史を変える。',             true,  true, 11, now()),
  ('66666666-1111-4111-8111-666666666672'::uuid, '11111111-1111-4111-8111-111111111115'::uuid, '天界の門番転生',           12, 'LR',  '/reiko_cards_v2/reiko_card12.png', '天界の門番に転生。全ての魂を大真面目に審査する宇宙最強の霊能者。',               true,  true, 12, now())
on conflict (id) do update set
  card_name    = excluded.card_name,
  star_level   = excluded.star_level,
  rarity       = excluded.rarity,
  card_image_url = excluded.card_image_url,
  description  = excluded.description,
  has_reversal = excluded.has_reversal,
  is_active    = excluded.is_active,
  sort_order   = excluded.sort_order,
  updated_at   = excluded.updated_at;

-- ⑤ 転生前シーン（4パターン × 2 = 8本）※CDN URL
with pre (pattern, scene_order, video_url, description) as (
  values
    ('A', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_A1.mp4', 'ガラガラの占いブースで居眠り (1/2)'),
    ('A', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_A2.mp4', '水晶玉が光り始める (2/2)'),
    ('B', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_B1.mp4', '督促状を「低級霊の仕業」と言い張る (1/2)'),
    ('B', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_B2.mp4', '督促状の山が光り始める (2/2)'),
    ('C', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_C1.mp4', '水晶玉を磨きながら「不吉だわ」 (1/2)'),
    ('C', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_C2.mp4', '水晶玉が本当に光り出す (2/2)'),
    ('D', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_D1.mp4', '夜中に借金電話に怯えながら儀式 (1/2)'),
    ('D', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/pre/reiko_pre_D2.mp4', '儀式が本当に反応する (2/2)')
)
insert into public.pre_stories (character_id, pattern, scene_order, video_url, duration_seconds, description)
select '11111111-1111-4111-8111-111111111115'::uuid, pattern, scene_order, video_url, 6, description
from pre
on conflict (character_id, pattern, scene_order) do update set
  video_url        = excluded.video_url,
  duration_seconds = excluded.duration_seconds,
  description      = excluded.description;

-- ⑥ 転生チャンスシーン（4本）※CDN URL
with chance (pattern, video_url, description) as (
  values
    ('A', 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/chance/reiko_chance_A.mp4', '水晶玉が爆光するチャンス演出'),
    ('B', 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/chance/reiko_chance_B.mp4', '督促状の山が光の柱に変わる'),
    ('C', 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/chance/reiko_chance_C.mp4', '磨いた水晶玉が本当に輝き出す'),
    ('D', 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/chance/reiko_chance_D.mp4', '真夜中の儀式が天に届く')
)
insert into public.chance_scenes (character_id, pattern, video_url, duration_seconds, description)
select '11111111-1111-4111-8111-111111111115'::uuid, pattern, video_url, 6, description
from chance
on conflict (character_id, pattern) do update set
  video_url        = excluded.video_url,
  duration_seconds = excluded.duration_seconds,
  description      = excluded.description;

-- ⑦ 既存シナリオをクリア（冪等性のため）
delete from public.scenarios
where card_id in (
  '66666666-1111-4111-8111-666666666661'::uuid,
  '66666666-1111-4111-8111-666666666662'::uuid,
  '66666666-1111-4111-8111-666666666663'::uuid,
  '66666666-1111-4111-8111-666666666664'::uuid,
  '66666666-1111-4111-8111-666666666665'::uuid,
  '66666666-1111-4111-8111-666666666666'::uuid,
  '66666666-1111-4111-8111-666666666667'::uuid,
  '66666666-1111-4111-8111-666666666668'::uuid,
  '66666666-1111-4111-8111-666666666669'::uuid,
  '66666666-1111-4111-8111-666666666670'::uuid,
  '66666666-1111-4111-8111-666666666671'::uuid,
  '66666666-1111-4111-8111-666666666672'::uuid
);

-- ⑧ メインシーン（42本）※CDN URL
insert into public.scenarios (card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  -- ★1 野良猫（2本）
  ('66666666-1111-4111-8111-666666666661'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c01_1.mp4', 8, '野良猫転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666661'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c01_2.mp4', 8, '野良猫転生 シーン2', 'neutral'),
  -- ★2 案山子（2本）
  ('66666666-1111-4111-8111-666666666662'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c02_1.mp4', 8, '案山子転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666662'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c02_2.mp4', 8, '案山子転生 シーン2', 'neutral'),
  -- ★3 魔女（3本）
  ('66666666-1111-4111-8111-666666666663'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c03_1.mp4', 8, '魔女転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666663'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c03_2.mp4', 8, '魔女転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666663'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c03_3.mp4', 8, '魔女転生 シーン3', 'neutral'),
  -- ★4 母（3本）
  ('66666666-1111-4111-8111-666666666664'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c04_1.mp4', 8, '母転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666664'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c04_2.mp4', 8, '母転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666664'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c04_3.mp4', 8, '母転生 シーン3', 'neutral'),
  -- ★5 茶屋女将（3本）
  ('66666666-1111-4111-8111-666666666665'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c05_1.mp4', 8, '茶屋女将転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666665'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c05_2.mp4', 8, '茶屋女将転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666665'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c05_3.mp4', 8, '茶屋女将転生 シーン3', 'neutral'),
  -- ★6 宇宙人（3本）
  ('66666666-1111-4111-8111-666666666666'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c06_1.mp4', 8, '宇宙人転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666666'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c06_2.mp4', 8, '宇宙人転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666666'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c06_3.mp4', 8, '宇宙人転生 シーン3', 'neutral'),
  -- ★7 修道女（4本）
  ('66666666-1111-4111-8111-666666666667'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c07_1.mp4', 8, '修道女転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666667'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c07_2.mp4', 8, '修道女転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666667'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c07_3.mp4', 8, '修道女転生 シーン3', 'neutral'),
  ('66666666-1111-4111-8111-666666666667'::uuid, 'main_story', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c07_4.mp4', 8, '修道女転生 シーン4', 'neutral'),
  -- ★8 女スパイ（4本）
  ('66666666-1111-4111-8111-666666666668'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c08_1.mp4', 8, '女スパイ転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666668'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c08_2.mp4', 8, '女スパイ転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666668'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c08_3.mp4', 8, '女スパイ転生 シーン3', 'neutral'),
  ('66666666-1111-4111-8111-666666666668'::uuid, 'main_story', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c08_4.mp4', 8, '女スパイ転生 シーン4', 'neutral'),
  -- ★9 本物の占い師（4本）
  ('66666666-1111-4111-8111-666666666669'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c09_1.mp4', 8, '本物の占い師転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666669'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c09_2.mp4', 8, '本物の占い師転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666669'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c09_3.mp4', 8, '本物の占い師転生 シーン3', 'neutral'),
  ('66666666-1111-4111-8111-666666666669'::uuid, 'main_story', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c09_4.mp4', 8, '本物の占い師転生 シーン4', 'neutral'),
  -- ★10 女王（4本）
  ('66666666-1111-4111-8111-666666666670'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c10_1.mp4', 8, '女王転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666670'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c10_2.mp4', 8, '女王転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666670'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c10_3.mp4', 8, '女王転生 シーン3', 'neutral'),
  ('66666666-1111-4111-8111-666666666670'::uuid, 'main_story', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c10_4.mp4', 8, '女王転生 シーン4', 'neutral'),
  -- ★11 ジャンヌ・ダルク（5本）
  ('66666666-1111-4111-8111-666666666671'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c11_1.mp4', 8, 'ジャンヌ・ダルク転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666671'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c11_2.mp4', 8, 'ジャンヌ・ダルク転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666671'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c11_3.mp4', 8, 'ジャンヌ・ダルク転生 シーン3', 'neutral'),
  ('66666666-1111-4111-8111-666666666671'::uuid, 'main_story', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c11_4.mp4', 8, 'ジャンヌ・ダルク転生 シーン4', 'neutral'),
  ('66666666-1111-4111-8111-666666666671'::uuid, 'main_story', 5, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c11_5.mp4', 8, 'ジャンヌ・ダルク転生 シーン5', 'neutral'),
  -- ★12 天界の門番（5本）
  ('66666666-1111-4111-8111-666666666672'::uuid, 'main_story', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c12_1.mp4', 8, '天界の門番転生 シーン1', 'neutral'),
  ('66666666-1111-4111-8111-666666666672'::uuid, 'main_story', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c12_2.mp4', 8, '天界の門番転生 シーン2', 'neutral'),
  ('66666666-1111-4111-8111-666666666672'::uuid, 'main_story', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c12_3.mp4', 8, '天界の門番転生 シーン3', 'neutral'),
  ('66666666-1111-4111-8111-666666666672'::uuid, 'main_story', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c12_4.mp4', 8, '天界の門番転生 シーン4', 'neutral'),
  ('66666666-1111-4111-8111-666666666672'::uuid, 'main_story', 5, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/main/reiko_c12_5.mp4', 8, '天界の門番転生 シーン5', 'neutral');

-- ⑨ どんでん返しシーン（10ルート × 2 = 20本）※CDN URL
insert into public.scenarios (card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  -- card05(茶屋女将): 野良猫から
  ('66666666-1111-4111-8111-666666666665'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c01_c05_1.mp4', 7, 'どんでん 野良猫→茶屋女将 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666665'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c01_c05_2.mp4', 7, 'どんでん 野良猫→茶屋女将 (2/2)', 'reversal'),
  -- card07(修道女): 野良猫から
  ('66666666-1111-4111-8111-666666666667'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c01_c07_1.mp4', 7, 'どんでん 野良猫→修道女 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666667'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c01_c07_2.mp4', 7, 'どんでん 野良猫→修道女 (2/2)', 'reversal'),
  -- card06(宇宙人): 案山子から
  ('66666666-1111-4111-8111-666666666666'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c02_c06_1.mp4', 7, 'どんでん 案山子→宇宙人 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666666'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c02_c06_2.mp4', 7, 'どんでん 案山子→宇宙人 (2/2)', 'reversal'),
  -- card08(女スパイ): 案山子から
  ('66666666-1111-4111-8111-666666666668'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c02_c08_1.mp4', 7, 'どんでん 案山子→女スパイ (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666668'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c02_c08_2.mp4', 7, 'どんでん 案山子→女スパイ (2/2)', 'reversal'),
  -- card09(占い師): 魔女から
  ('66666666-1111-4111-8111-666666666669'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c03_c09_1.mp4', 7, 'どんでん 魔女→占い師 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666669'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c03_c09_2.mp4', 7, 'どんでん 魔女→占い師 (2/2)', 'reversal'),
  -- card11(ジャンヌ): 魔女から
  ('66666666-1111-4111-8111-666666666671'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c03_c11_1.mp4', 7, 'どんでん 魔女→ジャンヌ (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666671'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c03_c11_2.mp4', 7, 'どんでん 魔女→ジャンヌ (2/2)', 'reversal'),
  -- card10(女王): 母から
  ('66666666-1111-4111-8111-666666666670'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c04_c10_1.mp4', 7, 'どんでん 母→女王 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666670'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c04_c10_2.mp4', 7, 'どんでん 母→女王 (2/2)', 'reversal'),
  -- card12(天界の門番): 母から
  ('66666666-1111-4111-8111-666666666672'::uuid, 'reversal', 1, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c04_c12_1.mp4', 7, 'どんでん 母→天界 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666672'::uuid, 'reversal', 2, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c04_c12_2.mp4', 7, 'どんでん 母→天界 (2/2)', 'reversal'),
  -- card11(ジャンヌ): 茶屋女将から（scene_order 3,4 — 魔女ルートと共存）
  ('66666666-1111-4111-8111-666666666671'::uuid, 'reversal', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c05_c11_1.mp4', 7, 'どんでん 女将→ジャンヌ (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666671'::uuid, 'reversal', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c05_c11_2.mp4', 7, 'どんでん 女将→ジャンヌ (2/2)', 'reversal'),
  -- card12(天界の門番): 宇宙人から（scene_order 3,4 — 母ルートと共存）
  ('66666666-1111-4111-8111-666666666672'::uuid, 'reversal', 3, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c06_c12_1.mp4', 7, 'どんでん 宇宙人→天界 (1/2)', 'reversal'),
  ('66666666-1111-4111-8111-666666666672'::uuid, 'reversal', 4, 'https://r2-video-worker.goldbenchan.workers.dev/videos/characters/reiko/reversal/reiko_rev_c06_c12_2.mp4', 7, 'どんでん 宇宙人→天界 (2/2)', 'reversal');
