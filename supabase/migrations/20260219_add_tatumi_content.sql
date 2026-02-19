-- 辰巳剛キャラクターデータ投入（カード・シナリオ・演出）

-- キャラクター本体
insert into public.characters (id, name, description, expectation_level, thumbnail_url, sort_order, is_active, updated_at)
values (
  '11111111-1111-4111-8111-111111111113'::uuid,
  '辰巳剛',
  '任侠の世界で生きた男の再出発モジュール',
  4,
  '/tatumi_cards/tatumi_card01.png',
  3,
  true,
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  expectation_level = excluded.expectation_level,
  thumbnail_url = excluded.thumbnail_url,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- カード12枚
insert into public.cards (
  id,
  character_id,
  card_name,
  star_level,
  rarity,
  card_image_url,
  description,
  has_reversal,
  is_active,
  sort_order,
  updated_at
)
values
  ('44444444-1111-4111-8111-444444444441'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '石ころ転生', 1, 'N', '/tatumi_cards/tatumi_card01.png', '踏まれても砕けず季節を見送る石ころ再起ルート。', false, true, 1, now()),
  ('44444444-1111-4111-8111-444444444442'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '虫転生', 2, 'N', '/tatumi_cards/tatumi_card02.png', '闇に怯えながらもひたすら生き抜く名もなき虫の執着。', false, true, 2, now()),
  ('44444444-1111-4111-8111-444444444443'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '野花転生', 3, 'R', '/tatumi_cards/tatumi_card03.png', 'アスファルトを割って伸びる一輪の野花、無骨な優しさの芽吹き。', false, true, 3, now()),
  ('44444444-1111-4111-8111-444444444444'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '塀の中転生', 4, 'R', '/tatumi_cards/tatumi_card04.png', '塀の内側で己と向き合い続ける10年の贖罪ロード。', false, true, 4, now()),
  ('44444444-1111-4111-8111-444444444445'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '5人の父転生', 5, 'SR', '/tatumi_cards/tatumi_card05.png', '5人の子どもを抱えて笑う、寡黙な父ちゃん第二章。', true, true, 5, now()),
  ('44444444-1111-4111-8111-444444444446'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '閻魔大王転生', 6, 'SR', '/tatumi_cards/tatumi_card06.png', '地獄の裁判官として筋を通す炎の玉座リターン。', true, true, 6, now()),
  ('44444444-1111-4111-8111-444444444447'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '探偵所長転生', 7, 'SSR', '/tatumi_cards/tatumi_card07.png', '裏社会の勘を駆使し影の依頼を請け負う探偵所長。', true, true, 7, now()),
  ('44444444-1111-4111-8111-444444444448'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '仏様転生', 8, 'SSR', '/tatumi_cards/tatumi_card08.png', '慈悲と覚悟が極まった先、蓮の上で人を救う仏の微笑。', true, true, 8, now()),
  ('44444444-1111-4111-8111-444444444449'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '武道家師範転生', 9, 'UR', '/tatumi_cards/tatumi_card09.png', '道場の床を鳴らす一喝、拳で教え導く伝説師範。', true, true, 9, now()),
  ('44444444-1111-4111-8111-444444444450'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '映画俳優転生', 10, 'UR', '/tatumi_cards/tatumi_card10.png', 'スーツの裾を翻しスクリーンを支配する強面専属俳優。', true, true, 10, now()),
  ('44444444-1111-4111-8111-444444444451'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '神龍転生', 11, 'LR', '/tatumi_cards/tatumi_card11.png', '涙が昇華して龍と化す、天空を旋回する神龍の覚醒。', true, true, 11, now()),
  ('44444444-1111-4111-8111-444444444452'::uuid, '11111111-1111-4111-8111-111111111113'::uuid, '閻魔大王（真）転生', 12, 'LR', '/tatumi_cards/tatumi_card12.png', '冥界を統治する究極の閻魔、因果を見通す最終章。', true, true, 12, now())
on conflict (id) do update set
  card_name = excluded.card_name,
  star_level = excluded.star_level,
  rarity = excluded.rarity,
  card_image_url = excluded.card_image_url,
  description = excluded.description,
  has_reversal = excluded.has_reversal,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

-- 転生前シーン 4パターン × 2ステップ
with pre (pattern, scene_order, video_url, description) as (
  values
    ('a', 1, '/videos/characters/tatumi/pre/tatumi_pre_a1.mp4', '夜の繁華街でチンピラに絡まれる (1/2)'),
    ('a', 2, '/videos/characters/tatumi/pre/tatumi_pre_a2.mp4', '夜の繁華街でチンピラに絡まれる (2/2)'),
    ('b', 1, '/videos/characters/tatumi/pre/tatumi_pre_b1.mp4', '深夜公園で後悔の涙 (1/2)'),
    ('b', 2, '/videos/characters/tatumi/pre/tatumi_pre_b2.mp4', '深夜公園で後悔の涙 (2/2)'),
    ('c', 1, '/videos/characters/tatumi/pre/tatumi_pre_c1.mp4', 'アパートで仏様が降臨 (1/2)'),
    ('c', 2, '/videos/characters/tatumi/pre/tatumi_pre_c2.mp4', 'アパートで仏様が降臨 (2/2)'),
    ('d', 1, '/videos/characters/tatumi/pre/tatumi_pre_d1.mp4', '盃返しに向かう夜道 (1/2)'),
    ('d', 2, '/videos/characters/tatumi/pre/tatumi_pre_d2.mp4', '盃返しに向かう夜道 (2/2)')
)
insert into public.pre_stories (character_id, pattern, scene_order, video_url, duration_seconds, description)
select '11111111-1111-4111-8111-111111111113'::uuid, pattern, scene_order, video_url, 6, description
from pre
on conflict (character_id, pattern, scene_order) do update set
  video_url = excluded.video_url,
  duration_seconds = excluded.duration_seconds,
  description = excluded.description;

-- 転生チャンス4本
with chance (pattern, video_url, description) as (
  values
    ('a', '/videos/characters/tatumi/chance/tatumi_chance_a.mp4', '天から黄金の拳が降下（コート姿）'),
    ('b', '/videos/characters/tatumi/chance/tatumi_chance_b.mp4', '涙が龍の形になって昇天（私服）'),
    ('c', '/videos/characters/tatumi/chance/tatumi_chance_c.mp4', '仏様が手を差し伸べ光が爆発（寝間着）'),
    ('d', '/videos/characters/tatumi/chance/tatumi_chance_d.mp4', '光の柱に冥界の門が出現（着流し）')
)
insert into public.chance_scenes (character_id, pattern, video_url, duration_seconds, description)
select '11111111-1111-4111-8111-111111111113'::uuid, pattern, video_url, 6, description
from chance
on conflict (character_id, pattern) do update set
  video_url = excluded.video_url,
  duration_seconds = excluded.duration_seconds,
  description = excluded.description;

-- 既存シナリオをクリア
delete from public.scenarios
where card_id in (
  '44444444-1111-4111-8111-444444444441'::uuid,
  '44444444-1111-4111-8111-444444444442'::uuid,
  '44444444-1111-4111-8111-444444444443'::uuid,
  '44444444-1111-4111-8111-444444444444'::uuid,
  '44444444-1111-4111-8111-444444444445'::uuid,
  '44444444-1111-4111-8111-444444444446'::uuid,
  '44444444-1111-4111-8111-444444444447'::uuid,
  '44444444-1111-4111-8111-444444444448'::uuid,
  '44444444-1111-4111-8111-444444444449'::uuid,
  '44444444-1111-4111-8111-444444444450'::uuid,
  '44444444-1111-4111-8111-444444444451'::uuid,
  '44444444-1111-4111-8111-444444444452'::uuid
);

-- メインシーン 42本
insert into public.scenarios (card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  ('44444444-1111-4111-8111-444444444441'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c01_1.mp4', 8, '石ころ転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444441'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c01_2.mp4', 8, '石ころ転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444442'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c02_1.mp4', 8, '虫転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444442'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c02_2.mp4', 8, '虫転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444443'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c03_1.mp4', 8, '野花転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444443'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c03_2.mp4', 8, '野花転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444443'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c03_3.mp4', 8, '野花転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444444'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c04_1.mp4', 8, '塀の中転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444444'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c04_2.mp4', 8, '塀の中転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444444'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c04_3.mp4', 8, '塀の中転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444445'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c05_1.mp4', 8, '5人の父転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444445'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c05_2.mp4', 8, '5人の父転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444445'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c05_3.mp4', 8, '5人の父転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444446'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c06_1.mp4', 8, '閻魔大王転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444446'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c06_2.mp4', 8, '閻魔大王転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444446'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c06_3.mp4', 8, '閻魔大王転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444447'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c07_1.mp4', 8, '探偵所長転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444447'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c07_2.mp4', 8, '探偵所長転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444447'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c07_3.mp4', 8, '探偵所長転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444447'::uuid, 'main_story', 4, '/videos/characters/tatumi/main/tatumi_c07_4.mp4', 8, '探偵所長転生 シーン4', 'neutral'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c08_1.mp4', 8, '仏様転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c08_2.mp4', 8, '仏様転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c08_3.mp4', 8, '仏様転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'main_story', 4, '/videos/characters/tatumi/main/tatumi_c08_4.mp4', 8, '仏様転生 シーン4', 'neutral'),
  ('44444444-1111-4111-8111-444444444449'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c09_1.mp4', 8, '武道家師範転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444449'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c09_2.mp4', 8, '武道家師範転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444449'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c09_3.mp4', 8, '武道家師範転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444449'::uuid, 'main_story', 4, '/videos/characters/tatumi/main/tatumi_c09_4.mp4', 8, '武道家師範転生 シーン4', 'neutral'),
  ('44444444-1111-4111-8111-444444444450'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c10_1.mp4', 8, '映画俳優転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444450'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c10_2.mp4', 8, '映画俳優転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444450'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c10_3.mp4', 8, '映画俳優転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444450'::uuid, 'main_story', 4, '/videos/characters/tatumi/main/tatumi_c10_4.mp4', 8, '映画俳優転生 シーン4', 'neutral'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c11_1.mp4', 8, '神龍転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c11_2.mp4', 8, '神龍転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c11_3.mp4', 8, '神龍転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'main_story', 4, '/videos/characters/tatumi/main/tatumi_c11_4.mp4', 8, '神龍転生 シーン4', 'neutral'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'main_story', 5, '/videos/characters/tatumi/main/tatumi_c11_5.mp4', 8, '神龍転生 シーン5', 'neutral'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'main_story', 1, '/videos/characters/tatumi/main/tatumi_c12_1.mp4', 8, '閻魔大王（真）転生 シーン1', 'neutral'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'main_story', 2, '/videos/characters/tatumi/main/tatumi_c12_2.mp4', 8, '閻魔大王（真）転生 シーン2', 'neutral'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'main_story', 3, '/videos/characters/tatumi/main/tatumi_c12_3.mp4', 8, '閻魔大王（真）転生 シーン3', 'neutral'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'main_story', 4, '/videos/characters/tatumi/main/tatumi_c12_4.mp4', 8, '閻魔大王（真）転生 シーン4', 'neutral'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'main_story', 5, '/videos/characters/tatumi/main/tatumi_c12_5.mp4', 8, '閻魔大王（真）転生 シーン5', 'neutral');

-- どんでん返し10ルート × 2ステップ
insert into public.scenarios (card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  ('44444444-1111-4111-8111-444444444445'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c01_c05_1.mp4', 7, 'どんでん 石ころ→父 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444445'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c01_c05_2.mp4', 7, 'どんでん 石ころ→父 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c01_c08_1.mp4', 7, 'どんでん 石ころ→仏様 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c01_c08_2.mp4', 7, 'どんでん 石ころ→仏様 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444446'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c02_c06_1.mp4', 7, 'どんでん 虫→閻魔 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444446'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c02_c06_2.mp4', 7, 'どんでん 虫→閻魔 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c02_c11_1.mp4', 7, 'どんでん 虫→神龍 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444451'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c02_c11_2.mp4', 7, 'どんでん 虫→神龍 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'reversal', 3, '/videos/characters/tatumi/donden/tatumi_rev_c03_c08_1.mp4', 7, 'どんでん 野花→仏様 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444448'::uuid, 'reversal', 4, '/videos/characters/tatumi/donden/tatumi_rev_c03_c08_2.mp4', 7, 'どんでん 野花→仏様 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444449'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c03_c09_1.mp4', 7, 'どんでん 野花→武道家 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444449'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c03_c09_2.mp4', 7, 'どんでん 野花→武道家 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444447'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c04_c07_1.mp4', 7, 'どんでん 塀の中→探偵 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444447'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c04_c07_2.mp4', 7, 'どんでん 塀の中→探偵 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444450'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c04_c10_1.mp4', 7, 'どんでん 塀の中→俳優 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444450'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c04_c10_2.mp4', 7, 'どんでん 塀の中→俳優 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'reversal', 1, '/videos/characters/tatumi/donden/tatumi_rev_c06_c12_1.mp4', 7, 'どんでん 閻魔→閻魔真 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'reversal', 2, '/videos/characters/tatumi/donden/tatumi_rev_c06_c12_2.mp4', 7, 'どんでん 閻魔→閻魔真 (2/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'reversal', 3, '/videos/characters/tatumi/donden/tatumi_rev_c09_c12_1.mp4', 7, 'どんでん 武道家→閻魔真 (1/2)', 'reversal'),
  ('44444444-1111-4111-8111-444444444452'::uuid, 'reversal', 4, '/videos/characters/tatumi/donden/tatumi_rev_c09_c12_2.mp4', 7, 'どんでん 武道家→閻魔真 (2/2)', 'reversal');
