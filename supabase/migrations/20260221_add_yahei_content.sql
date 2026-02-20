-- 弥平モジュール: キャラクター / カード / シナリオ投入

-- キャラクター本体
insert into public.characters (id, name, description, expectation_level, thumbnail_url, sort_order, is_active, updated_at)
values (
  '11111111-1111-4111-8111-111111111114'::uuid,
  '弥平',
  '江戸後期を生きる魚売り。天秤棒片手に世界中を駆けるカルチャーギャップ転生譚。',
  4,
  '/yahei_cards_v2/yahei_card01.png',
  4,
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
  ('55555555-1111-4111-8111-555555555551'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, '恐竜時代転生', 1, 'N', '/yahei_cards_v2/yahei_card01.png', '江戸っ子魂で白亜紀を駆け抜けるサバイバル開幕。', false, true, 1, now()),
  ('55555555-1111-4111-8111-555555555552'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, 'コンビニ店員転生', 2, 'N', '/yahei_cards_v2/yahei_card02.png', '最新文化に翻弄されつつレジを守る深夜の店番修行。', false, true, 2, now()),
  ('55555555-1111-4111-8111-555555555553'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, 'SNS炎上転生', 3, 'R', '/yahei_cards_v2/yahei_card03.png', 'てやんでぃ節が世界中に炎上拡散して大騒動。', false, true, 3, now()),
  ('55555555-1111-4111-8111-555555555554'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, '江戸幕府老中転生', 4, 'R', '/yahei_cards_v2/yahei_card04.png', 'まさかの重役入りで江戸城トップ層に殴り込み。', false, true, 4, now()),
  ('55555555-1111-4111-8111-555555555555'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, '宇宙飛行士転生', 5, 'SR', '/yahei_cards_v2/yahei_card05.png', '天秤棒を宇宙服に持ち替えてNASAの船で大冒険。', true, true, 5, now()),
  ('55555555-1111-4111-8111-555555555556'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, 'ヨーロッパ貴族転生', 6, 'SR', '/yahei_cards_v2/yahei_card06.png', 'パリの宮殿でマナー特訓、江戸言葉がサロンを席巻。', true, true, 6, now()),
  ('55555555-1111-4111-8111-555555555557'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, '寿司職人転生', 7, 'SSR', '/yahei_cards_v2/yahei_card07.png', '魚河岸仕込みの目利きがミシュラン級カウンターで炸裂。', true, true, 7, now()),
  ('55555555-1111-4111-8111-555555555558'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, '大相撲横綱転生', 8, 'SSR', '/yahei_cards_v2/yahei_card08.png', '土俵入りも江戸仕込み、情熱で横綱にまで上り詰める。', true, true, 8, now()),
  ('55555555-1111-4111-8111-555555555559'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, 'ハリウッド俳優転生', 9, 'UR', '/yahei_cards_v2/yahei_card09.png', 'SNSバズから一気にレッドカーペットの主役に抜擢。', true, true, 9, now()),
  ('55555555-1111-4111-8111-555555555560'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, '江戸城将軍転生', 10, 'UR', '/yahei_cards_v2/yahei_card10.png', '庶民目線の施策で江戸を救うカリスマ将軍伝説。', true, true, 10, now()),
  ('55555555-1111-4111-8111-555555555561'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, 'アメリカ大統領転生', 11, 'LR', '/yahei_cards_v2/yahei_card11.png', '江戸っ子気質でホワイトハウスの政治をぶん回す。', true, true, 11, now()),
  ('55555555-1111-4111-8111-555555555562'::uuid, '11111111-1111-4111-8111-111111111114'::uuid, 'タイムトラベラー転生', 12, 'LR', '/yahei_cards_v2/yahei_card12.png', '全時代を股にかけ魚籠片手に因果を見守る最終形態。', true, true, 12, now())
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
    ('a', 1, '/videos/characters/yahei/pre/yahei_pre_a1.mp4', '魚売りの帰り道で転生の兆し (1/2)'),
    ('a', 2, '/videos/characters/yahei/pre/yahei_pre_a2.mp4', '魚売りの帰り道で転生の兆し (2/2)'),
    ('b', 1, '/videos/characters/yahei/pre/yahei_pre_b1.mp4', '長屋で借金取りに追われる (1/2)'),
    ('b', 2, '/videos/characters/yahei/pre/yahei_pre_b2.mp4', '長屋で借金取りに追われる (2/2)'),
    ('c', 1, '/videos/characters/yahei/pre/yahei_pre_c1.mp4', '川で魚を捕まえようとして転生チャンス (1/2)'),
    ('c', 2, '/videos/characters/yahei/pre/yahei_pre_c2.mp4', '川で魚を捕まえようとして転生チャンス (2/2)'),
    ('d', 1, '/videos/characters/yahei/pre/yahei_pre_d1.mp4', 'お天道様に叫ぶ江戸っ子魂 (1/2)'),
    ('d', 2, '/videos/characters/yahei/pre/yahei_pre_d2.mp4', 'お天道様に叫ぶ江戸っ子魂 (2/2)')
)
insert into public.pre_stories (character_id, pattern, scene_order, video_url, duration_seconds, description)
select '11111111-1111-4111-8111-111111111114'::uuid, pattern, scene_order, video_url, 6, description
from pre
on conflict (character_id, pattern, scene_order) do update set
  video_url = excluded.video_url,
  duration_seconds = excluded.duration_seconds,
  description = excluded.description;

-- 転生チャンス4本
with chance (pattern, video_url, description) as (
  values
    ('a', '/videos/characters/yahei/chance/yahei_chance_a.mp4', '天から巨大な金色の魚が降下（帰り道姿）'),
    ('b', '/videos/characters/yahei/chance/yahei_chance_b.mp4', '金色の魔法陣が広がり借金取りが吹き飛ぶ（長屋姿）'),
    ('c', '/videos/characters/yahei/chance/yahei_chance_c.mp4', '川の中で黄金の龍が出現（びしょ濡れ姿）'),
    ('d', '/videos/characters/yahei/chance/yahei_chance_d.mp4', '天から巨大な光の手が降りてくる（夜空姿）')
)
insert into public.chance_scenes (character_id, pattern, video_url, duration_seconds, description)
select '11111111-1111-4111-8111-111111111114'::uuid, pattern, video_url, 6, description
from chance
on conflict (character_id, pattern) do update set
  video_url = excluded.video_url,
  duration_seconds = excluded.duration_seconds,
  description = excluded.description;

-- 既存シナリオを念のためクリア
delete from public.scenarios
where card_id in (
  '55555555-1111-4111-8111-555555555551'::uuid,
  '55555555-1111-4111-8111-555555555552'::uuid,
  '55555555-1111-4111-8111-555555555553'::uuid,
  '55555555-1111-4111-8111-555555555554'::uuid,
  '55555555-1111-4111-8111-555555555555'::uuid,
  '55555555-1111-4111-8111-555555555556'::uuid,
  '55555555-1111-4111-8111-555555555557'::uuid,
  '55555555-1111-4111-8111-555555555558'::uuid,
  '55555555-1111-4111-8111-555555555559'::uuid,
  '55555555-1111-4111-8111-555555555560'::uuid,
  '55555555-1111-4111-8111-555555555561'::uuid,
  '55555555-1111-4111-8111-555555555562'::uuid
);

-- メインシーン 42本
insert into public.scenarios (card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  -- ★1 恐竜時代
  ('55555555-1111-4111-8111-555555555551'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c01_1.mp4', 8, '恐竜時代転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555551'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c01_2.mp4', 8, '恐竜時代転生 シーン2', 'neutral'),
  -- ★2 コンビニ店員
  ('55555555-1111-4111-8111-555555555552'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c02_1.mp4', 8, 'コンビニ店員転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555552'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c02_2.mp4', 8, 'コンビニ店員転生 シーン2', 'neutral'),
  -- ★3 SNS炎上
  ('55555555-1111-4111-8111-555555555553'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c03_1.mp4', 8, 'SNS炎上転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555553'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c03_2.mp4', 8, 'SNS炎上転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555553'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c03_3.mp4', 8, 'SNS炎上転生 シーン3', 'neutral'),
  -- ★4 江戸幕府老中
  ('55555555-1111-4111-8111-555555555554'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c04_1.mp4', 8, '江戸幕府老中転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555554'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c04_2.mp4', 8, '江戸幕府老中転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555554'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c04_3.mp4', 8, '江戸幕府老中転生 シーン3', 'neutral'),
  -- ★5 宇宙飛行士
  ('55555555-1111-4111-8111-555555555555'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c05_1.mp4', 8, '宇宙飛行士転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555555'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c05_2.mp4', 8, '宇宙飛行士転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555555'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c05_3.mp4', 8, '宇宙飛行士転生 シーン3', 'neutral'),
  -- ★6 ヨーロッパ貴族
  ('55555555-1111-4111-8111-555555555556'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c06_1.mp4', 8, 'ヨーロッパ貴族転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555556'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c06_2.mp4', 8, 'ヨーロッパ貴族転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555556'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c06_3.mp4', 8, 'ヨーロッパ貴族転生 シーン3', 'neutral'),
  -- ★7 寿司職人
  ('55555555-1111-4111-8111-555555555557'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c07_1.mp4', 8, '寿司職人転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555557'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c07_2.mp4', 8, '寿司職人転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555557'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c07_3.mp4', 8, '寿司職人転生 シーン3', 'neutral'),
  ('55555555-1111-4111-8111-555555555557'::uuid, 'main_story', 4, '/videos/characters/yahei/main/yahei_c07_4.mp4', 8, '寿司職人転生 シーン4', 'neutral'),
  -- ★8 大相撲横綱
  ('55555555-1111-4111-8111-555555555558'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c08_1.mp4', 8, '大相撲横綱転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555558'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c08_2.mp4', 8, '大相撲横綱転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555558'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c08_3.mp4', 8, '大相撲横綱転生 シーン3', 'neutral'),
  ('55555555-1111-4111-8111-555555555558'::uuid, 'main_story', 4, '/videos/characters/yahei/main/yahei_c08_4.mp4', 8, '大相撲横綱転生 シーン4', 'neutral'),
  -- ★9 ハリウッド俳優
  ('55555555-1111-4111-8111-555555555559'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c09_1.mp4', 8, 'ハリウッド俳優転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555559'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c09_2.mp4', 8, 'ハリウッド俳優転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555559'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c09_3.mp4', 8, 'ハリウッド俳優転生 シーン3', 'neutral'),
  ('55555555-1111-4111-8111-555555555559'::uuid, 'main_story', 4, '/videos/characters/yahei/main/yahei_c09_4.mp4', 8, 'ハリウッド俳優転生 シーン4', 'neutral'),
  -- ★10 江戸城将軍
  ('55555555-1111-4111-8111-555555555560'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c10_1.mp4', 8, '江戸城将軍転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555560'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c10_2.mp4', 8, '江戸城将軍転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555560'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c10_3.mp4', 8, '江戸城将軍転生 シーン3', 'neutral'),
  ('55555555-1111-4111-8111-555555555560'::uuid, 'main_story', 4, '/videos/characters/yahei/main/yahei_c10_4.mp4', 8, '江戸城将軍転生 シーン4', 'neutral'),
  -- ★11 アメリカ大統領
  ('55555555-1111-4111-8111-555555555561'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c11_1.mp4', 8, 'アメリカ大統領転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555561'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c11_2.mp4', 8, 'アメリカ大統領転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555561'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c11_3.mp4', 8, 'アメリカ大統領転生 シーン3', 'neutral'),
  ('55555555-1111-4111-8111-555555555561'::uuid, 'main_story', 4, '/videos/characters/yahei/main/yahei_c11_4.mp4', 8, 'アメリカ大統領転生 シーン4', 'neutral'),
  ('55555555-1111-4111-8111-555555555561'::uuid, 'main_story', 5, '/videos/characters/yahei/main/yahei_c11_5.mp4', 8, 'アメリカ大統領転生 シーン5', 'neutral'),
  -- ★12 タイムトラベラー
  ('55555555-1111-4111-8111-555555555562'::uuid, 'main_story', 1, '/videos/characters/yahei/main/yahei_c12_1.mp4', 8, 'タイムトラベラー転生 シーン1', 'neutral'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'main_story', 2, '/videos/characters/yahei/main/yahei_c12_2.mp4', 8, 'タイムトラベラー転生 シーン2', 'neutral'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'main_story', 3, '/videos/characters/yahei/main/yahei_c12_3.mp4', 8, 'タイムトラベラー転生 シーン3', 'neutral'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'main_story', 4, '/videos/characters/yahei/main/yahei_c12_4.mp4', 8, 'タイムトラベラー転生 シーン4', 'neutral'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'main_story', 5, '/videos/characters/yahei/main/yahei_c12_5.mp4', 8, 'タイムトラベラー転生 シーン5', 'neutral');

-- どんでん返し 10ルート × 2ステップ
insert into public.scenarios (card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  -- card05: 恐竜→宇宙
  ('55555555-1111-4111-8111-555555555555'::uuid, 'reversal', 1, '/videos/characters/yahei/donden/yahei_rev_c01_c05_1.mp4', 7, 'どんでん 恐竜→宇宙 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555555'::uuid, 'reversal', 2, '/videos/characters/yahei/donden/yahei_rev_c01_c05_2.mp4', 7, 'どんでん 恐竜→宇宙 (2/2)', 'reversal'),
  -- card12: 恐竜→タイムトラベラー
  ('55555555-1111-4111-8111-555555555562'::uuid, 'reversal', 1, '/videos/characters/yahei/donden/yahei_rev_c01_c12_1.mp4', 7, 'どんでん 恐竜→タイム (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'reversal', 2, '/videos/characters/yahei/donden/yahei_rev_c01_c12_2.mp4', 7, 'どんでん 恐竜→タイム (2/2)', 'reversal'),
  -- card07: コンビニ→寿司
  ('55555555-1111-4111-8111-555555555557'::uuid, 'reversal', 1, '/videos/characters/yahei/donden/yahei_rev_c02_c07_1.mp4', 7, 'どんでん コンビニ→寿司 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555557'::uuid, 'reversal', 2, '/videos/characters/yahei/donden/yahei_rev_c02_c07_2.mp4', 7, 'どんでん コンビニ→寿司 (2/2)', 'reversal'),
  -- card09: コンビニ→ハリウッド
  ('55555555-1111-4111-8111-555555555559'::uuid, 'reversal', 1, '/videos/characters/yahei/donden/yahei_rev_c02_c09_1.mp4', 7, 'どんでん コンビニ→俳優 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555559'::uuid, 'reversal', 2, '/videos/characters/yahei/donden/yahei_rev_c02_c09_2.mp4', 7, 'どんでん コンビニ→俳優 (2/2)', 'reversal'),
  -- card09: SNS→ハリウッド (継続番号)
  ('55555555-1111-4111-8111-555555555559'::uuid, 'reversal', 3, '/videos/characters/yahei/donden/yahei_rev_c03_c09_1.mp4', 7, 'どんでん SNS→俳優 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555559'::uuid, 'reversal', 4, '/videos/characters/yahei/donden/yahei_rev_c03_c09_2.mp4', 7, 'どんでん SNS→俳優 (2/2)', 'reversal'),
  -- card11: SNS→大統領
  ('55555555-1111-4111-8111-555555555561'::uuid, 'reversal', 1, '/videos/characters/yahei/donden/yahei_rev_c03_c11_1.mp4', 7, 'どんでん SNS→大統領 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555561'::uuid, 'reversal', 2, '/videos/characters/yahei/donden/yahei_rev_c03_c11_2.mp4', 7, 'どんでん SNS→大統領 (2/2)', 'reversal'),
  -- card10: 老中→将軍
  ('55555555-1111-4111-8111-555555555560'::uuid, 'reversal', 1, '/videos/characters/yahei/donden/yahei_rev_c04_c10_1.mp4', 7, 'どんでん 老中→将軍 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555560'::uuid, 'reversal', 2, '/videos/characters/yahei/donden/yahei_rev_c04_c10_2.mp4', 7, 'どんでん 老中→将軍 (2/2)', 'reversal'),
  -- card12: 老中→タイムトラベラー (継続番号)
  ('55555555-1111-4111-8111-555555555562'::uuid, 'reversal', 3, '/videos/characters/yahei/donden/yahei_rev_c04_c12_1.mp4', 7, 'どんでん 老中→タイム (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'reversal', 4, '/videos/characters/yahei/donden/yahei_rev_c04_c12_2.mp4', 7, 'どんでん 老中→タイム (2/2)', 'reversal'),
  -- card11: 貴族→大統領 (継続番号)
  ('55555555-1111-4111-8111-555555555561'::uuid, 'reversal', 3, '/videos/characters/yahei/donden/yahei_rev_c06_c11_1.mp4', 7, 'どんでん 貴族→大統領 (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555561'::uuid, 'reversal', 4, '/videos/characters/yahei/donden/yahei_rev_c06_c11_2.mp4', 7, 'どんでん 貴族→大統領 (2/2)', 'reversal'),
  -- card12: 横綱→タイム (継続番号)
  ('55555555-1111-4111-8111-555555555562'::uuid, 'reversal', 5, '/videos/characters/yahei/donden/yahei_rev_c08_c12_1.mp4', 7, 'どんでん 横綱→タイム (1/2)', 'reversal'),
  ('55555555-1111-4111-8111-555555555562'::uuid, 'reversal', 6, '/videos/characters/yahei/donden/yahei_rev_c08_c12_2.mp4', 7, 'どんでん 横綱→タイム (2/2)', 'reversal');
