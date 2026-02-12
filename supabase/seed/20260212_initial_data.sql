insert into public.characters (id, name, description, expectation_level, thumbnail_url, sort_order)
values (
  '11111111-1111-4111-8111-111111111111',
  '健太',
  '25歳のコンビニ店員。転生で人生を大逆転させたい青年。',
  2,
  '/placeholders/kenta-thumb.svg',
  1
)
on conflict (id) do nothing;

insert into public.cards (
  id, character_id, card_name, star_level, rarity, card_image_url, description, has_reversal, sort_order
)
values
  ('22222222-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','コンビニ店員 健太',1,'N','/placeholders/card-default.svg','転生初期の健太。コンビニ夜勤で奮闘中。',false,1),
  ('22222222-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','小アジの健太',2,'N','/placeholders/card-default.svg','魚として生きる不思議な転生。',false,2),
  ('22222222-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','異国の少年 健太',3,'R','/placeholders/card-default.svg','情熱を秘めた少年時代。',false,3),
  ('22222222-1111-4111-8111-111111111114','11111111-1111-4111-8111-111111111111','再起の魂 健太',4,'R','/placeholders/card-default.svg','挫折から蘇る力が芽生える。',true,4),
  ('22222222-1111-4111-8111-111111111115','11111111-1111-4111-8111-111111111111','海神の化身 健太',5,'SR','/placeholders/card-default.svg','海を司る守護者となる転生。',true,5),
  ('22222222-1111-4111-8111-111111111116','11111111-1111-4111-8111-111111111111','村の英雄 健太',6,'SR','/placeholders/card-default.svg','村を救うヒーローへ。',true,6),
  ('22222222-1111-4111-8111-111111111117','11111111-1111-4111-8111-111111111111','幸せの父 健太',7,'SSR','/placeholders/card-default.svg','穏やかな家庭を築く。',false,7),
  ('22222222-1111-4111-8111-111111111118','11111111-1111-4111-8111-111111111111','コンビニ王 健太',8,'SSR','/placeholders/card-default.svg','チェーンを世界に広げた経営者。',false,8),
  ('22222222-1111-4111-8111-111111111119','11111111-1111-4111-8111-111111111111','伝説の経営者 健太',9,'UR','/placeholders/card-default.svg','世界で最も注目されるCEO。',true,9),
  ('22222222-1111-4111-8111-111111111120','11111111-1111-4111-8111-111111111111','世界のコンビニ王 健太',10,'UR','/placeholders/card-default.svg','コンビニ文化を世界に革命。',true,10),
  ('22222222-1111-4111-8111-111111111121','11111111-1111-4111-8111-111111111111','東京ドームの星 健太',11,'LR','/placeholders/card-default.svg','アーティストとして東京ドームを満員に。',false,11),
  ('22222222-1111-4111-8111-111111111122','11111111-1111-4111-8111-111111111111','世界の伝説 健太',12,'LR','/placeholders/card-default.svg','全世界が称える伝説級の転生。',true,12)
on conflict (id) do nothing;

-- Basic pre-story patterns
insert into public.pre_stories (id, character_id, pattern, scene_order, video_url, duration_seconds, description)
values
  ('33333333-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','A',1,'/videos/placeholder-pre.mp4',6,'夜勤に疲れた健太が新たな転生を夢見る'),
  ('33333333-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','B',1,'/videos/placeholder-pre.mp4',6,'幼少期の記憶が蘇る転生前兆')
on conflict (id) do nothing;

-- Chance scenes
insert into public.chance_scenes (id, character_id, pattern, video_url, duration_seconds, description)
values
  ('44444444-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','A','/videos/placeholder-chance.mp4',6,'転生ルーレットが高速回転'),
  ('44444444-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','B','/videos/placeholder-chance.mp4',6,'転生の鍵を手に入れるチャンス')
on conflict (id) do nothing;

-- Minimal scenario rows for each card
insert into public.scenarios (id, card_id, phase, scene_order, video_url, duration_seconds, telop_text, telop_type)
values
  ('55555555-1111-4111-8111-111111111111','22222222-1111-4111-8111-111111111111','main_story',1,'/videos/placeholder-main.mp4',8,'まだまだこれから','neutral'),
  ('55555555-1111-4111-8111-111111111112','22222222-1111-4111-8111-111111111112','main_story',1,'/videos/placeholder-main.mp4',8,'旅立ちの朝','neutral'),
  ('55555555-1111-4111-8111-111111111113','22222222-1111-4111-8111-111111111113','main_story',1,'/videos/placeholder-main.mp4',8,'遠い国で目覚める','neutral'),
  ('55555555-1111-4111-8111-111111111114','22222222-1111-4111-8111-111111111114','main_story',1,'/videos/placeholder-main.mp4',8,'逆境を跳ね返せ','neutral'),
  ('55555555-1111-4111-8111-111111111115','22222222-1111-4111-8111-111111111115','reversal',1,'/videos/placeholder-reversal.mp4',8,'奇跡の逆転','reversal'),
  ('55555555-1111-4111-8111-111111111116','22222222-1111-4111-8111-111111111116','reversal',1,'/videos/placeholder-reversal.mp4',8,'運命を書き換える','reversal'),
  ('55555555-1111-4111-8111-111111111117','22222222-1111-4111-8111-111111111117','main_story',1,'/videos/placeholder-main.mp4',8,'家族の笑顔','win'),
  ('55555555-1111-4111-8111-111111111118','22222222-1111-4111-8111-111111111118','main_story',1,'/videos/placeholder-main.mp4',8,'経営大成功','win'),
  ('55555555-1111-4111-8111-111111111119','22222222-1111-4111-8111-111111111119','reversal',1,'/videos/placeholder-reversal.mp4',8,'伝説への扉','reversal'),
  ('55555555-1111-4111-8111-111111111120','22222222-1111-4111-8111-111111111120','reversal',1,'/videos/placeholder-reversal.mp4',8,'世界を覆す瞬間','reversal'),
  ('55555555-1111-4111-8111-111111111121','22222222-1111-4111-8111-111111111121','main_story',1,'/videos/placeholder-main.mp4',8,'ステージを支配する','epic'),
  ('55555555-1111-4111-8111-111111111122','22222222-1111-4111-8111-111111111122','reversal',1,'/videos/placeholder-reversal.mp4',8,'伝説級の逆転','reversal')
on conflict (id) do nothing;

insert into public.gacha_config (slug, rtp_config, reversal_rates, character_weights)
values (
  'default',
  '[{"star":1,"probability":0.15},{"star":2,"probability":0.13},{"star":3,"probability":0.12},{"star":4,"probability":0.11},{"star":5,"probability":0.10},{"star":6,"probability":0.09},{"star":7,"probability":0.08},{"star":8,"probability":0.07},{"star":9,"probability":0.05},{"star":10,"probability":0.04},{"star":11,"probability":0.04},{"star":12,"probability":0.02}]'::jsonb,
  '{"1":0.02,"2":0.03,"3":0.04,"4":0.06,"5":0.08,"6":0.10,"7":0.12,"8":0.15,"9":0.18,"10":0.22,"11":0.25,"12":0.30}'::jsonb,
  '[{"characterId":"11111111-1111-4111-8111-111111111111","weight":1}]'::jsonb
)
on conflict (slug) do update set
  rtp_config = excluded.rtp_config,
  reversal_rates = excluded.reversal_rates,
  character_weights = excluded.character_weights,
  updated_at = now();
