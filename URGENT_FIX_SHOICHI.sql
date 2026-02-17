-- ⚠️ 緊急修正: 正一キャラクターを有効化する
-- このSQLをSupabase SQL Editorで実行してください

-- 1. 正一を有効化
UPDATE gacha_characters
SET 
  is_active = true,
  weight = 50,
  updated_at = now()
WHERE character_id = 'shoichi';

-- 2. 結果を確認
SELECT 
  character_id,
  character_name,
  is_active,
  weight,
  updated_at
FROM gacha_characters
ORDER BY character_id;

-- 期待される結果:
-- character_id | character_name | is_active | weight
-- -------------|----------------|-----------|-------
-- kenta        | 健太           | true      | 50-60
-- shoichi      | 正一           | true      | 50

-- 3. RTP設定も確認
SELECT 
  character_id,
  rarity_n + rarity_r + rarity_sr + rarity_ssr + rarity_ur + rarity_lr as total_rtp,
  donden_rate
FROM gacha_rtp_config
ORDER BY character_id;

-- 4. （オプション）健太と正一の比率を50:50にする場合
UPDATE gacha_characters
SET weight = 50, updated_at = now()
WHERE character_id IN ('kenta', 'shoichi');
